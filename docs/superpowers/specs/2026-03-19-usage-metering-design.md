# Usage Metering System — Design Spec

## Context

Robin Wood processes audio and text (with image/video planned). Before deciding on a billing model (Free/Pro/Enterprise tiers with per-resource quotas), we need a rich metering layer that records everything that happens — bytes, durations, dimensions, formats, operations — so billing can be built on top without rewriting the metering.

### Decisions Made

- **Approach:** Metering-First — record all dimensions now, billing decides what to charge later
- **Granularity:** Capture every possible dimension per pipeline type (duration, bytes, format, resolution, etc.)
- **Operation categories:** Only `basic` for now (ffmpeg/local). AI tier deferred.
- **Billing model (future):** Free/Pro/Enterprise with quotas per resource (audio, text, image, video separately)
- **Quota reset:** Monthly fixed (day 1 of month or account creation date)
- **Current enforcement:** Removed — no limits enforced until billing is implemented

## 1. UsageEvent Schema (Expanded)

The existing `UsageEvent` model is expanded with type-specific metadata fields and a `jobId` reference.

### Fields

```
UsageEvent
├── idempotencyKey: string (unique)
├── userId: string (indexed)
├── apiKeyId?: string
├── jobId: string                          // NEW — reference to Job._id
├── pipelineType: 'audio' | 'text' | 'image' | 'video'
├── operations: string[]
├── inputBytes: number
├── outputBytes: number
├── processingMs: number
├── timestamp: Date (indexed)
│
├── audio?: {                              // NEW — only when pipelineType = 'audio'
│     durationMs: number                   // input duration in milliseconds
│     format: string                       // 'mp3' | 'wav'
│     sampleRate: number                   // e.g. 44100, 48000
│     channels: number                     // 1 (mono) or 2 (stereo)
│   }
├── text?: {                               // NEW — only when pipelineType = 'text'
│     characterCount: number               // input character count
│     wordCount: number                    // input word count
│     encoding: string                     // e.g. 'utf-8'
│   }
├── image?: {                              // NEW — placeholder for future
│     width: number
│     height: number
│     format: string                       // 'png' | 'jpg' | 'webp'
│     megapixels: number                   // width * height / 1_000_000
│   }
└── video?: {                              // NEW — placeholder for future
      durationMs: number
      width: number
      height: number
      format: string                       // 'mp4' | 'webm'
      fps: number
      codec: string                        // 'h264' | 'h265' | 'vp9'
    }
```

### Indexes

Existing indexes are sufficient:
- `{ userId: 1, timestamp: -1 }`
- `{ apiKeyId: 1, timestamp: -1 }`

No new indexes needed at current volume.

### Removed

- `tokensSaved` field — was mixing metering with billing (input - output). Raw `inputBytes`/`outputBytes` remain; billing interprets them.

## 2. Recording Flow

### When: After successful processing only

Failed jobs do not generate usage events — the user consumed nothing.

### Where: In the worker, after job completion

```
Job enters worker
  → Download input
  → Extract metadata (ffprobe for audio, char/word count for text)
  → Process
  → Upload output
  → Update Job (status: completed, metrics)
  → Record UsageEvent with all data    ← here
```

### Idempotency

Key format: `job:{jobId}`. If BullMQ retries a job, the duplicate `UsageEvent` insert is rejected by the unique index on `idempotencyKey`.

### Audio processor changes (`audio.processor.ts`)

1. Run `ffprobe` on the input file to extract: `durationMs`, `sampleRate`, `channels`, `format`
2. After successful processing and upload, call `UsageService.record()` with:
   - All existing fields (inputBytes, outputBytes, processingMs, operations)
   - New: `jobId`, `audio: { durationMs, format, sampleRate, channels }`

### Text processor changes (`text.processor.ts`)

1. Calculate `characterCount` and `wordCount` from input text
2. After successful processing, call `UsageService.record()` with:
   - All existing fields
   - New: `jobId`, `text: { characterCount, wordCount, encoding: 'utf-8' }`

## 3. UsageService Changes

### `record(input)` method

- Accept new optional fields: `jobId`, `audio`, `text`, `image`, `video`
- **Remove** the `User.tokens.used` increment — metering no longer touches the User document
- Save the enriched `UsageEvent` to MongoDB

### `getAnalytics(userId, range)` method — Redesigned

**`GET /usage/analytics?range=7d|30d|90d|1y`**

Response:

```typescript
{
  summary: {
    totalRequests: number
    totalInputBytes: number
    totalOutputBytes: number
    byPipeline: {
      audio?: {
        requests: number
        totalMinutes: number        // sum of durationMs → minutes
        totalInputBytes: number
        totalOutputBytes: number
      }
      text?: {
        requests: number
        totalCharacters: number
        totalWords: number
        totalInputBytes: number
        totalOutputBytes: number
      }
      image?: {
        requests: number
        totalMegapixels: number
        totalInputBytes: number
        totalOutputBytes: number
      }
      video?: {
        requests: number
        totalMinutes: number
        totalInputBytes: number
        totalOutputBytes: number
      }
    }
  }
  chart: [{ date: string, requests: number }]  // "DD/MM" format
  recent: UsageEvent[]                          // last 10 events, full data
}
```

### `getCurrentUsage(userId)` method — Redesigned

**`GET /usage/current`**

Response:

```typescript
{
  period: { start: Date, end: Date }    // current calendar month
  audio:  { requests: number, minutes: number, inputBytes: number }
  text:   { requests: number, characters: number, inputBytes: number }
  image:  { requests: number, megapixels: number, inputBytes: number }
  video:  { requests: number, minutes: number, inputBytes: number }
}
```

Image and video return zeros until implemented.

### Removed

- `checkLimits()` method — no enforcement until billing is built
- `GET /usage/limits` endpoint — removed

## 4. What Gets Deprecated (Not Deleted)

| Item | Action |
|------|--------|
| `User.tokens.limit` | Keep in schema, stop reading |
| `User.tokens.used` | Keep in schema, stop writing |
| `UsageEvent.tokensSaved` | Remove from schema |
| `UsageService.checkLimits()` | Remove method |
| `GET /usage/limits` | Remove route |

The `tokens` field on User stays in the model to avoid a migration — it becomes inert until billing replaces it.

## 5. Files Affected

| File | Change |
|------|--------|
| `api/src/modules/usage/usage.model.ts` | Add `jobId`, `audio`, `text`, `image`, `video` fields; remove `tokensSaved` |
| `api/src/modules/usage/usage.types.ts` | Update `RecordUsageInput`, analytics response types |
| `api/src/modules/usage/usage.service.ts` | Remove token increment, accept new fields, redesign analytics |
| `api/src/modules/usage/usage.routes.ts` | Update responses, remove `/usage/limits` |
| `api/src/worker/audio.processor.ts` | Add ffprobe metadata extraction, call `record()` with audio data |
| `api/src/worker/text.processor.ts` | Add char/word count, call `record()` with text data |
| `dashboard/types/index.ts` | Update `UsageAnalytics` type to match new response |
| `dashboard/app/http/usage.ts` | Update functions to match new endpoints |
| `dashboard/app/components/dashboard/` | Update analytics components for new data structure |

## 6. What This Does NOT Include

- Billing tiers / plans / subscriptions
- Payment processing
- Rate limiting
- Quota enforcement
- AI operation category/pricing
- Organizations / teams
