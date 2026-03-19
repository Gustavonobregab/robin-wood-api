# Audio File Upload — Design Spec

## Overview

Replace the current URL-based audio input (`audioUrl`) with direct file upload via `multipart/form-data`. Audio files are uploaded to S3 with auto-delete, and referenced by ID when creating processing jobs.

**Pattern**: AssemblyAI-style two-step (upload → process), storage like ElevenLabs (ephemeral, no permanent retention).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upload method | `multipart/form-data` | Simple, covers 90%+ of use cases under 100MB |
| Storage | AWS S3 | Industry standard, native lifecycle policies |
| Size limit | 100MB | Permissive; plan-based limits in the future |
| Accepted formats | `.mp3`, `.wav` | Minimal, covers most use cases |
| Retention | 24h uploads, 72h outputs | Auto-delete via S3 lifecycle + MongoDB TTL |
| Billing on upload | No | Only on processing (future) |
| URL-based input | Removed | Replaced entirely by upload flow |

## Flow

```
Client                    API                      S3                    Worker
  |                        |                       |                      |
  |-- POST /upload ------->|                       |                      |
  |   (multipart: file)    |-- validate magic bytes|                      |
  |                        |-- PutObject ---------->|                      |
  |                        |<-- ok ----------------|                      |
  |<-- { id, expiresAt } --|                       |                      |
  |                        |                       |                      |
  |-- POST /audio -------->|                       |                      |
  |   { audioId, ops }     |-- verify ownership ---|                      |
  |                        |-- create job + enqueue |--------------------->|
  |<-- { job } ------------|                       |                      |
  |                        |                       |  GetObject            |
  |                        |                       |<---------------------|
  |                        |                       |  (FFmpeg pipeline)    |
  |                        |                       |  PutObject (output)   |
  |                        |                       |<---------------------|
```

## New Module: `upload`

### File Structure

```
api/src/modules/upload/
├── upload.routes.ts
├── upload.service.ts
├── upload.model.ts
└── upload.types.ts
```

### MongoDB Schema (`upload.model.ts`)

```typescript
{
  userId: string            // indexed — who uploaded
  originalName: string      // original filename (e.g. "podcast.mp3")
  mimeType: string          // "audio/mpeg" or "audio/wav"
  size: number              // bytes
  s3Key: string             // "uploads/{userId}/{uploadId}.mp3"
  status: "ready"           // set after successful PutObject (single-step, no "pending")
  expiresAt: Date           // 24h after creation
}
```

**Indexes**: `(userId, createdAt)`, `expiresAt` (TTL — MongoDB auto-deletes expired docs, may lag ~60s).

**Status lifecycle**: The upload document is only created after a successful `PutObject` to S3, so it is always `"ready"`. If the S3 upload fails, no document is created (the endpoint returns an error). Documents are deleted by MongoDB TTL when `expiresAt` passes — the application must also check `expiresAt > now` explicitly since TTL deletion can lag.

### Endpoint: `POST /upload`

**Input**: `multipart/form-data` with field `audio` (file).

**Validation**:
1. Size: max 100MB (Elysia body limit)
2. Extension: `.mp3` or `.wav`
3. Magic bytes verification (not just Content-Type):
   - MP3: starts with `FF FB`, `FF F3`, `FF F2`, or `ID3`
   - MP3: also `FF FA` (MPEG1 Layer 3 with CRC). `ID3` header means ID3v2 tag is present — sufficient for format validation.
   - WAV: bytes 0-3 `RIFF` AND bytes 8-11 `WAVE` (distinguishes from other RIFF formats like AVI)
4. S3 key: `uploads/{userId}/{ulid}.{ext}` — no user-controlled path segments

**Response**:
```json
{
  "id": "01HX...",
  "originalName": "podcast.mp3",
  "size": 5242880,
  "expiresAt": "2026-03-20T14:00:00.000Z"
}
```

## New Config: `storage.ts`

```
api/src/config/
└── storage.ts    — S3Client instance from @aws-sdk/client-s3
```

Reads `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` from env.

## Changes to Existing Files

### `audio.routes.ts`

- `POST /audio`: body changes from `{ audioUrl, preset?, operations? }` to `{ audioId, preset?, operations? }`
- `audioId` is a string referencing an upload document

### `audio.service.ts`

- `processAudio` receives `audioId` instead of `audioUrl`
- Resolves `audioId` → upload document → validates ownership, status, and `expiresAt > now`
- Creates job with `source: { kind: "storage", ref: upload.s3Key }`
- Sets job payload `name` to `upload.originalName` (preserves human-readable job identifier)

### `audio.types.ts`

- Remove `audioUrl` references
- Remove URL-related schemas

### `job.types.ts`

- `JobSource` union is shared across audio, text, and image payloads — keep both `"url"` and `"storage"` variants in the shared type
- `AudioJobPayload.source` is narrowed to only `{ kind: "storage", ref: string }` (audio-specific)

### `audio.processor.ts` (Worker)

Current flow:
1. `fetch(url)` → temp file → FFmpeg → TODO upload output

New flow:
1. `GetObject(s3Key)` → temp file → FFmpeg → `PutObject` output to `outputs/{jobId}/result.mp3`
2. Generate presigned download URL for output — expiry set to `object creation time + 72h` (aligned with S3 lifecycle, not from generation time)
3. Save `outputUrl` (presigned) in job result
4. Clean up temp dir (follows existing `finally` block pattern)

### `server.ts`

- Register `uploadRoutes` under the Elysia app

## S3 Configuration

**Bucket**: single bucket with prefix-based lifecycle rules

| Prefix | Lifecycle | Purpose |
|--------|-----------|---------|
| `uploads/` | Delete after 24h | Input files |
| `outputs/` | Delete after 72h | Processed results |

**Access**: Bucket is private. Outputs served via presigned URLs.

## New Dependency

- `@aws-sdk/client-s3` — AWS SDK v3 (modular, only S3 client)
- `@aws-sdk/s3-request-presigner` — for generating presigned download URLs

## Security

- Magic bytes validation prevents disguised file uploads
- S3 keys use server-generated ULIDs, no user input in paths
- Ownership check: upload must belong to the authenticated user
- Status check: upload must be `ready` and `expiresAt > now`
- No public S3 access; outputs via time-limited presigned URLs

## Error Responses

All errors use the existing `ApiError` pattern (`{ code, message, status }`).

| Scenario | Code | Status |
|----------|------|--------|
| Missing `audio` field | `MISSING_FILE` | 400 |
| Invalid format (extension or magic bytes) | `INVALID_FORMAT` | 422 |
| File too large | `FILE_TOO_LARGE` | 413 |
| `audioId` not found | `UPLOAD_NOT_FOUND` | 404 |
| Upload belongs to another user | `UPLOAD_NOT_FOUND` | 404 |
| Upload expired | `UPLOAD_EXPIRED` | 410 |
