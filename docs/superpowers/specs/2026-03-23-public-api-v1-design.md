# Public API v1 — Design Spec

## Overview

Public-facing REST API authenticated via API keys, versioned under `/v1`. Exposes the same processing capabilities as the dashboard (audio, text, upload, usage) but for programmatic consumption.

## Goals

- Provide a stable, versioned API for external consumers
- Authenticate via API keys (`sk_live_*`) instead of session cookies
- Reuse existing services — no business logic duplication
- Structure code for future versioning (`/v2`, etc.)

## Non-Goals (this iteration)

- Rate limiting (future iteration)
- Webhook notifications for job completion
- Auto-generated documentation (Mintlify will be done separately)

---

## Architecture

### Approach

Separate route layer under `v1/` that calls the same services used by dashboard routes. The API public routes and dashboard routes are decoupled — they can evolve independently.

### Directory Structure

```
api/src/
├── v1/
│   ├── api.middleware.ts    # API key auth + requestId generation
│   ├── api.routes.ts        # All public API routes
│   ├── api.types.ts         # Types specific to the v1 API
│   └── index.ts             # Mounts middleware + routes with /v1 prefix
├── modules/                 # Shared services, models, types (unchanged)
├── middlewares/              # Dashboard middlewares (unchanged)
└── server.ts                # Adds .use(v1Routes)
```

### Mounting

In `server.ts`:

```typescript
const { v1Routes } = await import('./v1/index');

const app = new Elysia()
  // ... existing dashboard setup ...
  .use(v1Routes)  // public API
```

---

## Authentication

### Mechanism

API key via `Authorization` header with Bearer scheme.

### Flow

1. Extract `Authorization: Bearer sk_live_xxx` from request header
2. If header missing → `401` with code `API_KEY_REQUIRED`
3. If format invalid (not `Bearer sk_live_*`) → `401` with code `INVALID_API_KEY_FORMAT`
4. Call `keysService.validateApiKey(key)` (requires minor change — see below)
5. If key invalid/revoked → `401` with code `INVALID_API_KEY`
6. Generate `requestId` (`req_` + `crypto.randomUUID()`)
7. Set `X-Request-Id` response header
8. Derive `{ userId, apiKeyId, requestId }` into Elysia context

### Key Reuse

The `keysService.validateApiKey()` already handles:
- Finding the key in the database
- Checking it's `active` (not revoked)
- Updating `lastUsedAt`
- Returning `{ valid, userId, keyName }`

**Required change:** Add `keyId: keyRecord._id.toString()` to the return value of `validateApiKey()` so the middleware can derive `apiKeyId` into context.

---

## Response Format

Reuses the existing `apiErrorPlugin` from `utils/api-error.ts`, which is already registered globally in `server.ts`. The v1 plugin must **not** re-register `apiErrorPlugin` — it applies automatically to all routes including `/v1`.

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Not enough credits for this operation"
  }
}
```

### Request ID

Every response includes `X-Request-Id` header with a unique identifier (`req_*`). Useful for debugging and support.

---

## Endpoints

All endpoints are prefixed with `/v1` and require API key authentication.

### Audio Processing

| Method | Path | Service Call | Description |
|--------|------|-------------|-------------|
| POST | `/v1/audio` | `audioService.processAudio(userId, input)` | Create audio processing job |
| GET | `/v1/audio/jobs/:id` | `jobService.getStatus(userId, jobId)` | Get job status |
| GET | `/v1/audio/presets` | `audioService.listPresets()` | List available presets |
| GET | `/v1/audio/operations` | `audioService.listOperations()` | List available operations |

**POST /v1/audio input:**
```typescript
{
  audioId: string       // upload ID from /v1/upload
  preset?: AudioPreset  // "chill" | "medium" | "aggressive" | "podcast" | "lecture"
  operations?: AudioOperation[]  // custom operations (1-10)
}
```

### Text Processing

| Method | Path | Service Call | Description |
|--------|------|-------------|-------------|
| POST | `/v1/text` | `textService.processText(userId, input)` | Create text processing job |
| GET | `/v1/text/jobs/:id` | `jobService.getStatus(userId, jobId)` | Get job status |
| GET | `/v1/text/presets` | `textService.listPresets()` | List available presets |
| GET | `/v1/text/operations` | `textService.listOperations()` | List available operations |

**POST /v1/text input:**
```typescript
{
  text?: string          // inline text (up to 5MB)
  fileId?: string        // upload ID from /v1/upload/document
  preset?: TextPreset    // "chill" | "medium" | "aggressive"
  operations?: TextOperation[]  // custom operations (1-10)
}
```

**Sync vs Async:** Text ≤50KB processes synchronously and returns output inline. Larger text goes through BullMQ queue.

### Upload

| Method | Path | Service Call | Description |
|--------|------|-------------|-------------|
| POST | `/v1/upload` | `uploadService.uploadAudio(userId, file)` | Upload audio file |
| POST | `/v1/upload/document` | `uploadService.uploadFile(userId, file)` | Upload document |

**Multipart field names:** `audio` for `POST /v1/upload`, `file` for `POST /v1/upload/document` (matches dashboard routes).

**Constraints:** File size limit from user's plan (`plan.features.maxFileSize`). Allowed formats: `.mp3`, `.wav`, `.pdf`, `.txt`. Files validated via magic bytes. Uploads expire after 24 hours.

### Usage

| Method | Path | Service Call | Description |
|--------|------|-------------|-------------|
| GET | `/v1/usage/current` | `usageService.getCurrentUsage(userId, periodStart, periodEnd)` | Current billing period usage |

**Note:** The route handler must fetch the user's `subscription.currentPeriodStart` and `subscription.currentPeriodEnd` and pass them to `getCurrentUsage()` so the response aligns with the actual billing cycle (not calendar month).

---

## Middleware Detail: `api.middleware.ts`

Exports a scoped Elysia plugin that:

1. Runs on every request under `/v1`
2. Extracts and validates the API key
3. Generates a `requestId`
4. Sets `X-Request-Id` response header
5. Derives `{ userId, apiKeyId, requestId }` into Elysia's context

The `userId` derived here is identical to what `validateAuth` derives for dashboard routes — services are agnostic to the auth source.

---

## Types: `api.types.ts`

```typescript
// Context derived by the API key middleware
interface ApiContext {
  userId: string
  apiKeyId: string
  requestId: string
}
```

---

## Credit Enforcement

The existing `reserveCredits()` function from `middlewares/credits.ts` is called directly inside the services (`audioService.processAudio`, `textService.processText`). Since these services receive `userId` and handle credit reservation internally, no changes are needed — the credit system works identically for dashboard and API consumers.

---

## Data Flow

```
Client → POST /v1/audio (Authorization: Bearer sk_live_xxx)
  ↓ api.middleware: validate API key → derive userId
  ↓ api.routes: validate input
  ↓ audioService.processAudio(userId, input)
      ↓ reserveCredits(userId, 'audio')
      ↓ jobService.create(...)
      ↓ jobService.enqueue(job)
  ↓ return job object
  ↓ apiErrorPlugin wraps in { success: true, data: job }
  ↓ X-Request-Id header added
Client ← response

Client → GET /v1/audio/jobs/:id
  ↓ api.middleware: validate API key
  ↓ jobService.getStatus(userId, jobId)  // ownership check
  ↓ return { id, status, result?, error? }
Client ← response
```

---

## Input Validation

The v1 routes must reuse the same Elysia TypeBox schemas from existing type files (`AudioOperationSchema`, `AudioPresetSchema`, `TextOperationSchema`, `TextPresetSchema`) to ensure consistent input validation between dashboard and public API.

---

## CORS

The `/v1` routes are intended for server-to-server use and inherit the existing CORS policy. Browser-based API consumption is not a goal for this iteration.

---

## What Changes in Existing Code

| File | Change |
|------|--------|
| `server.ts` | Add `import('./v1/index')` and `.use(v1Routes)` |
| `keys.service.ts` | Add `keyId` to `validateApiKey()` return value |
| `job.service.ts` | Add `userId` parameter to `getStatus()` for ownership check |

---

## Future Considerations

- **Rate limiting:** Redis-based sliding window, per API key, with `X-RateLimit-*` headers
- **Webhooks:** Callback URL per request for job completion notifications
- **Documentation:** Mintlify-based API docs
- **v2:** New directory `v2/` following the same pattern
