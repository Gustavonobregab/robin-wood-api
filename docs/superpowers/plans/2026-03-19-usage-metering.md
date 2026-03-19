# Usage Metering System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the usage tracking layer with per-pipeline metadata (audio duration, text char count, image/video placeholders) so billing can be built on top without rewriting metering.

**Architecture:** Expand UsageEvent with type-specific subdocuments, introduce `record()` calls in workers with ffprobe/text metadata extraction, redesign analytics endpoints to return per-pipeline breakdowns, and update dashboard types to match.

**Tech Stack:** Bun, Mongoose, fluent-ffmpeg (ffprobe), BullMQ workers, Elysia routes, Next.js dashboard (TypeScript types + ky HTTP layer)

**Spec:** `docs/superpowers/specs/2026-03-19-usage-metering-design.md`

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `api/src/modules/usage/usage.types.ts` | All usage TypeScript types | Modify |
| `api/src/modules/usage/usage.model.ts` | Mongoose schema for UsageEvent | Modify |
| `api/src/modules/usage/usage.service.ts` | Business logic for recording + analytics | Modify |
| `api/src/modules/usage/usage.routes.ts` | Elysia route definitions | Modify |
| `api/src/modules/jobs/job.types.ts` | Job type definitions (fix enum mismatch) | Modify |
| `api/src/worker/audio/probe.ts` | ffprobe helper to extract audio metadata | Create |
| `api/src/worker/audio.processor.ts` | Audio worker — add timing, probe, record() | Modify |
| `api/src/worker/text.processor.ts` | Text worker — add timing, text stats, record() | Modify |
| `dashboard/types/index.ts` | Dashboard shared types | Modify |
| `dashboard/app/http/usage.ts` | Dashboard HTTP functions for usage | Modify |

---

### Task 1: Fix JobStatus enum mismatch (prerequisite)

**Files:**
- Modify: `api/src/modules/jobs/job.types.ts:6-11`

- [ ] **Step 1: Align JobStatus type to match the Mongoose model values**

In `api/src/modules/jobs/job.types.ts`, replace:

```typescript
export type JobStatus =
  | "created"
  | "queued"
  | "running"
  | "succeeded"
  | "failed";
```

With:

```typescript
export type JobStatus =
  | "created"
  | "pending"
  | "processing"
  | "completed"
  | "failed";
```

This aligns with `job.model.ts` line 8: `enum: ['created', 'pending', 'processing', 'completed', 'failed']`.

- [ ] **Step 2: Verify no code depends on old values**

Run: `cd /Users/gustavonobregab/Programming/robin-monorepo && grep -r "queued\|running\|succeeded" api/src/ --include="*.ts" -l`

Expected: No matches outside of `job.types.ts` (which was already changed). If anything references old values, update it.

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/jobs/job.types.ts
git commit -m "fix: align JobStatus type with Mongoose model enum"
```

---

### Task 2: Update usage types

**Files:**
- Modify: `api/src/modules/usage/usage.types.ts`

- [ ] **Step 1: Rewrite usage.types.ts**

Replace the entire file with:

```typescript
import type { ObjectId } from 'mongoose';

export type PipelineType = 'audio' | 'text' | 'image' | 'video';

// --- Per-pipeline metadata ---

export interface AudioMetadata {
  durationMs: number;
  format: string;
  sampleRate: number;
  channels: number;
}

export interface TextMetadata {
  characterCount: number;
  wordCount: number;
  encoding: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  megapixels: number;
}

export interface VideoMetadata {
  durationMs: number;
  width: number;
  height: number;
  format: string;
  fps: number;
  codec: string;
}

// --- UsageEvent document ---

export interface UsageEvent {
  _id: ObjectId;
  idempotencyKey: string;
  userId: string;
  jobId: string;
  pipelineType: PipelineType;
  operations: string[];
  inputBytes: number;
  outputBytes: number;
  processingMs: number;
  timestamp: Date;
  audio?: AudioMetadata;
  text?: TextMetadata;
  image?: ImageMetadata;
  video?: VideoMetadata;
}

// --- Service input/output ---

export interface RecordUsageInput {
  idempotencyKey: string;
  userId: string;
  jobId: string;
  pipelineType: PipelineType;
  operations: string[];
  inputBytes: number;
  outputBytes: number;
  processingMs: number;
  audio?: AudioMetadata;
  text?: TextMetadata;
  image?: ImageMetadata;
  video?: VideoMetadata;
}

export interface RecordUsageResult {
  eventId: string;
}

// --- Analytics ---

export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface PipelineUsageSummary {
  requests: number;
  totalInputBytes: number;
  totalOutputBytes: number;
}

export interface AudioPipelineSummary extends PipelineUsageSummary {
  totalMinutes: number;
}

export interface TextPipelineSummary extends PipelineUsageSummary {
  totalCharacters: number;
  totalWords: number;
}

export interface ImagePipelineSummary extends PipelineUsageSummary {
  totalMegapixels: number;
}

export interface VideoPipelineSummary extends PipelineUsageSummary {
  totalMinutes: number;
}

export interface UsageAnalytics {
  summary: {
    totalRequests: number;
    totalInputBytes: number;
    totalOutputBytes: number;
    byPipeline: {
      audio?: AudioPipelineSummary;
      text?: TextPipelineSummary;
      image?: ImagePipelineSummary;
      video?: VideoPipelineSummary;
    };
  };
  chart: { date: string; requests: number }[];
  recent: UsageEvent[];
}

export interface CurrentUsage {
  period: { start: Date; end: Date };
  audio: { requests: number; minutes: number; inputBytes: number };
  text: { requests: number; characters: number; inputBytes: number };
  image: { requests: number; megapixels: number; inputBytes: number };
  video: { requests: number; minutes: number; inputBytes: number };
}

// Default free tier (500MB) — kept for users.model.ts schema default
export const DEFAULT_TOKENS_LIMIT = 500_000_000;
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/gustavonobregab/Programming/robin-monorepo/api && bunx tsc --noEmit src/modules/usage/usage.types.ts 2>&1 | head -20`

Expected: May show errors from other files that import old types — that's fine, we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/usage/usage.types.ts
git commit -m "refactor: rewrite usage types with per-pipeline metadata"
```

---

### Task 3: Update UsageEvent Mongoose model

**Files:**
- Modify: `api/src/modules/usage/usage.model.ts`

- [ ] **Step 1: Rewrite usage.model.ts**

Replace the entire file with:

```typescript
import { Schema, model, Model } from 'mongoose';
import type { UsageEvent } from './usage.types';

const usageEventSchema = new Schema<UsageEvent>({
  idempotencyKey: { type: String, required: true, unique: true },

  userId: { type: String, required: true, index: true },
  jobId: { type: String, required: true },

  pipelineType: { type: String, enum: ['audio', 'text', 'image', 'video'], required: true },
  operations: { type: [String], required: true },

  inputBytes: { type: Number, required: true },
  outputBytes: { type: Number, required: true },

  processingMs: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },

  // Per-pipeline metadata (only one is populated per event)
  audio: {
    durationMs: Number,
    format: String,
    sampleRate: Number,
    channels: Number,
  },
  text: {
    characterCount: Number,
    wordCount: Number,
    encoding: String,
  },
  image: {
    width: Number,
    height: Number,
    format: String,
    megapixels: Number,
  },
  video: {
    durationMs: Number,
    width: Number,
    height: Number,
    format: String,
    fps: Number,
    codec: String,
  },
});

usageEventSchema.index({ userId: 1, timestamp: -1 });

export const UsageEventModel: Model<UsageEvent> = model<UsageEvent>('UsageEvent', usageEventSchema);
```

Key changes: removed `apiKeyId`, removed `tokensSaved`, added `jobId`, added `audio`/`text`/`image`/`video` subdocuments, removed `apiKeyId` index.

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/usage/usage.model.ts
git commit -m "refactor: update UsageEvent schema with per-pipeline metadata"
```

---

### Task 4: Rewrite UsageService

**Files:**
- Modify: `api/src/modules/usage/usage.service.ts`

- [ ] **Step 1: Rewrite usage.service.ts**

Replace the entire file with:

```typescript
import { UsageEventModel } from './usage.model';
import { subDays, format, startOfMonth, endOfMonth } from 'date-fns';
import type {
  RecordUsageInput,
  RecordUsageResult,
  TimeRange,
  UsageAnalytics,
  CurrentUsage,
  UsageEvent,
} from './usage.types';

export class UsageService {
  async record(input: RecordUsageInput): Promise<RecordUsageResult> {
    const existingEvent = await UsageEventModel.findOne({
      idempotencyKey: input.idempotencyKey,
    });

    if (existingEvent) {
      return { eventId: existingEvent._id.toString() };
    }

    const event = await UsageEventModel.create({
      idempotencyKey: input.idempotencyKey,
      userId: input.userId,
      jobId: input.jobId,
      pipelineType: input.pipelineType,
      operations: input.operations,
      inputBytes: input.inputBytes,
      outputBytes: input.outputBytes,
      processingMs: input.processingMs,
      timestamp: new Date(),
      audio: input.audio,
      text: input.text,
      image: input.image,
      video: input.video,
    });

    return { eventId: event._id.toString() };
  }

  async getAnalytics(userId: string, range: TimeRange = '30d'): Promise<UsageAnalytics> {
    const now = new Date();
    const rangeDays: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const startDate = subDays(now, rangeDays[range]);

    const events = await UsageEventModel.find({
      userId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 }).lean();

    // Summary
    const totalRequests = events.length;
    const totalInputBytes = events.reduce((acc, e) => acc + e.inputBytes, 0);
    const totalOutputBytes = events.reduce((acc, e) => acc + e.outputBytes, 0);

    // Per-pipeline breakdown
    const byPipeline: UsageAnalytics['summary']['byPipeline'] = {};

    const audioEvents = events.filter(e => e.pipelineType === 'audio');
    if (audioEvents.length > 0) {
      byPipeline.audio = {
        requests: audioEvents.length,
        totalInputBytes: audioEvents.reduce((acc, e) => acc + e.inputBytes, 0),
        totalOutputBytes: audioEvents.reduce((acc, e) => acc + e.outputBytes, 0),
        totalMinutes: audioEvents.reduce((acc, e) => acc + (e.audio?.durationMs || 0), 0) / 60_000,
      };
    }

    const textEvents = events.filter(e => e.pipelineType === 'text');
    if (textEvents.length > 0) {
      byPipeline.text = {
        requests: textEvents.length,
        totalInputBytes: textEvents.reduce((acc, e) => acc + e.inputBytes, 0),
        totalOutputBytes: textEvents.reduce((acc, e) => acc + e.outputBytes, 0),
        totalCharacters: textEvents.reduce((acc, e) => acc + (e.text?.characterCount || 0), 0),
        totalWords: textEvents.reduce((acc, e) => acc + (e.text?.wordCount || 0), 0),
      };
    }

    const imageEvents = events.filter(e => e.pipelineType === 'image');
    if (imageEvents.length > 0) {
      byPipeline.image = {
        requests: imageEvents.length,
        totalInputBytes: imageEvents.reduce((acc, e) => acc + e.inputBytes, 0),
        totalOutputBytes: imageEvents.reduce((acc, e) => acc + e.outputBytes, 0),
        totalMegapixels: imageEvents.reduce((acc, e) => acc + (e.image?.megapixels || 0), 0),
      };
    }

    const videoEvents = events.filter(e => e.pipelineType === 'video');
    if (videoEvents.length > 0) {
      byPipeline.video = {
        requests: videoEvents.length,
        totalInputBytes: videoEvents.reduce((acc, e) => acc + e.inputBytes, 0),
        totalOutputBytes: videoEvents.reduce((acc, e) => acc + e.outputBytes, 0),
        totalMinutes: videoEvents.reduce((acc, e) => acc + (e.video?.durationMs || 0), 0) / 60_000,
      };
    }

    // Chart — daily request counts
    const chartMap = new Map<string, number>();
    let loopDate = new Date(startDate);
    while (loopDate <= now) {
      chartMap.set(format(loopDate, 'dd/MM'), 0);
      loopDate.setDate(loopDate.getDate() + 1);
    }
    events.forEach(e => {
      const key = format(new Date(e.timestamp), 'dd/MM');
      if (chartMap.has(key)) {
        chartMap.set(key, (chartMap.get(key) || 0) + 1);
      }
    });
    const chart = Array.from(chartMap.entries()).map(([date, requests]) => ({ date, requests }));

    // Recent — last 10 raw events
    const recent = events.slice(0, 10) as unknown as UsageEvent[];

    return {
      summary: { totalRequests, totalInputBytes, totalOutputBytes, byPipeline },
      chart,
      recent,
    };
  }

  async getCurrentUsage(userId: string): Promise<CurrentUsage> {
    const now = new Date();
    const periodStart = startOfMonth(now);
    const periodEnd = endOfMonth(now);

    const events = await UsageEventModel.find({
      userId,
      timestamp: { $gte: periodStart, $lte: periodEnd },
    }).lean();

    const audioEvents = events.filter(e => e.pipelineType === 'audio');
    const textEvents = events.filter(e => e.pipelineType === 'text');
    const imageEvents = events.filter(e => e.pipelineType === 'image');
    const videoEvents = events.filter(e => e.pipelineType === 'video');

    return {
      period: { start: periodStart, end: periodEnd },
      audio: {
        requests: audioEvents.length,
        minutes: audioEvents.reduce((acc, e) => acc + (e.audio?.durationMs || 0), 0) / 60_000,
        inputBytes: audioEvents.reduce((acc, e) => acc + e.inputBytes, 0),
      },
      text: {
        requests: textEvents.length,
        characters: textEvents.reduce((acc, e) => acc + (e.text?.characterCount || 0), 0),
        inputBytes: textEvents.reduce((acc, e) => acc + e.inputBytes, 0),
      },
      image: {
        requests: imageEvents.length,
        megapixels: imageEvents.reduce((acc, e) => acc + (e.image?.megapixels || 0), 0),
        inputBytes: imageEvents.reduce((acc, e) => acc + e.inputBytes, 0),
      },
      video: {
        requests: videoEvents.length,
        minutes: videoEvents.reduce((acc, e) => acc + (e.video?.durationMs || 0), 0) / 60_000,
        inputBytes: videoEvents.reduce((acc, e) => acc + e.inputBytes, 0),
      },
    };
  }

  async getUserStats(userId: string) {
    const totalRequests = await UsageEventModel.countDocuments({ userId });
    return { totalRequests };
  }
}

export const usageService = new UsageService();
```

Key changes: `record()` no longer touches User.tokens, no more `checkLimits()`, no more `formatBytes()`, analytics returns raw events and per-pipeline breakdowns.

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/usage/usage.service.ts
git commit -m "refactor: rewrite UsageService with per-pipeline analytics, remove token tracking"
```

---

### Task 5: Update usage routes

**Files:**
- Modify: `api/src/modules/usage/usage.routes.ts`

- [ ] **Step 1: Remove /limits route and update imports**

Replace the entire file with:

```typescript
import { Elysia, t } from 'elysia';
import { validateAuth } from '../../middlewares/auth';
import { usageService } from './usage.service';

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .use(validateAuth)

  .get('/current', async ({ userId }) => {
    return await usageService.getCurrentUsage(userId);
  })

  .get('/analytics', async ({ userId, query }) => {
    return await usageService.getAnalytics(userId, query.range ?? '30d');
  }, {
    query: t.Object({
      range: t.Optional(t.Union([
        t.Literal('7d'),
        t.Literal('30d'),
        t.Literal('90d'),
        t.Literal('1y'),
      ])),
    }),
  });
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/usage/usage.routes.ts
git commit -m "refactor: remove /usage/limits endpoint"
```

---

### Task 6: Create ffprobe helper for audio metadata

**Files:**
- Create: `api/src/worker/audio/probe.ts`

- [ ] **Step 1: Create probe.ts**

```typescript
import ffmpeg from 'fluent-ffmpeg';

export interface AudioProbeResult {
  durationMs: number;
  format: string;
  sampleRate: number;
  channels: number;
}

export function probeAudio(filePath: string): Promise<AudioProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const stream = metadata.streams.find(s => s.codec_type === 'audio');
      if (!stream) return reject(new Error('No audio stream found'));

      resolve({
        durationMs: Math.round((metadata.format.duration || 0) * 1000),
        format: metadata.format.format_name?.split(',')[0] || 'unknown',
        sampleRate: stream.sample_rate ? Number(stream.sample_rate) : 0,
        channels: stream.channels || 0,
      });
    });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/worker/audio/probe.ts
git commit -m "feat: add ffprobe helper for audio metadata extraction"
```

---

### Task 7: Integrate usage recording into audio processor

**Files:**
- Modify: `api/src/worker/audio.processor.ts`

- [ ] **Step 1: Add imports at the top of the file**

Add after the existing imports:

```typescript
import { probeAudio } from './audio/probe';
import { usageService } from '../modules/usage/usage.service';
```

- [ ] **Step 2: Add timing, probe metadata early, then record usage after job completion**

Inside the `try` block, make these changes:

1. Add `const start = Date.now();` as the first line (before `const s3Key = ...`).

2. After `await Bun.write(inputPath, buffer);` (line 54), add the ffprobe call:

```typescript
    // Extract audio metadata before processing
    const probeResult = await probeAudio(inputPath);
    log(id, `Probed — ${(probeResult.durationMs / 1000).toFixed(1)}s, ${probeResult.sampleRate}Hz, ${probeResult.channels}ch`);
```

3. After the `await JobModel.findByIdAndUpdate(id, { status: 'completed', ... })` block (line ~103 after insertions), add:

```typescript
    // Record usage event
    const processingMs = Date.now() - start;

    await usageService.record({
      idempotencyKey: `job:${id}`,
      userId: jobDoc.userId,
      jobId: id,
      pipelineType: 'audio',
      operations: payload.operations.map((op) => op.type),
      inputBytes: inputSize,
      outputBytes: outputSize,
      processingMs,
      audio: {
        durationMs: probeResult.durationMs,
        format: probeResult.format,
        sampleRate: probeResult.sampleRate,
        channels: probeResult.channels,
      },
    });

    log(id, 'Usage recorded');
```

This follows the spec's flow: download → extract metadata → process → upload → record usage. Probing early means if ffprobe fails, we fail fast before wasting time on processing.

- [ ] **Step 3: Commit**

```bash
git add api/src/worker/audio.processor.ts
git commit -m "feat: record usage events in audio processor with ffprobe metadata"
```

---

### Task 8: Integrate usage recording into text processor

**Files:**
- Modify: `api/src/worker/text.processor.ts`

- [ ] **Step 1: Add import at the top of the file**

Add after the existing imports:

```typescript
import { usageService } from '../modules/usage/usage.service';
```

- [ ] **Step 2: Add timing and text stats, then record usage after job completion**

Inside the `try` block, add `const start = Date.now();` as the first line (before `const source = payload.source;`).

After the `await JobModel.findByIdAndUpdate(id, { status: 'completed', ... })` block (line 61), add:

```typescript
    // Record usage event
    const processingMs = Date.now() - start;

    await usageService.record({
      idempotencyKey: `job:${id}`,
      userId: jobDoc.userId,
      jobId: id,
      pipelineType: 'text',
      operations: payload.operations.map((op) => op.type),
      inputBytes: inputSize,
      outputBytes: outputSize,
      processingMs,
      text: {
        characterCount: input.length,
        wordCount: input.split(/\s+/).filter(Boolean).length,
        encoding: 'utf-8',
      },
    });

    log(id, `Usage recorded — ${input.length} chars`);
```

- [ ] **Step 3: Commit**

```bash
git add api/src/worker/text.processor.ts
git commit -m "feat: record usage events in text processor with char/word count"
```

---

### Task 9: Update dashboard types

**Files:**
- Modify: `dashboard/types/index.ts`

- [ ] **Step 1: Replace the Usage section**

In `dashboard/types/index.ts`, replace the entire `// ─── Usage ───` section (lines 34-72) with:

```typescript
// ─── Usage ───────────────────────────────────────────────────
export interface UsageChartPoint {
  date: string
  requests: number
}

export interface UsageEvent {
  _id: string
  idempotencyKey: string
  userId: string
  jobId: string
  pipelineType: 'audio' | 'text' | 'image' | 'video'
  operations: string[]
  inputBytes: number
  outputBytes: number
  processingMs: number
  timestamp: string
  audio?: {
    durationMs: number
    format: string
    sampleRate: number
    channels: number
  }
  text?: {
    characterCount: number
    wordCount: number
    encoding: string
  }
  image?: {
    width: number
    height: number
    format: string
    megapixels: number
  }
  video?: {
    durationMs: number
    width: number
    height: number
    format: string
    fps: number
    codec: string
  }
}

export interface PipelineUsageSummary {
  requests: number
  totalInputBytes: number
  totalOutputBytes: number
}

export interface UsageAnalytics {
  summary: {
    totalRequests: number
    totalInputBytes: number
    totalOutputBytes: number
    byPipeline: {
      audio?: PipelineUsageSummary & { totalMinutes: number }
      text?: PipelineUsageSummary & { totalCharacters: number; totalWords: number }
      image?: PipelineUsageSummary & { totalMegapixels: number }
      video?: PipelineUsageSummary & { totalMinutes: number }
    }
  }
  chart: UsageChartPoint[]
  recent: UsageEvent[]
}

export interface CurrentUsage {
  period: { start: string; end: string }
  audio: { requests: number; minutes: number; inputBytes: number }
  text: { requests: number; characters: number; inputBytes: number }
  image: { requests: number; megapixels: number; inputBytes: number }
  video: { requests: number; minutes: number; inputBytes: number }
}
```

- [ ] **Step 2: Update RecentJobsTable component**

In `dashboard/app/components/dashboard/RecentJobsTable.tsx`, replace the entire file with:

```tsx
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/app/components/ui/table'
import type { UsageEvent } from '@/types'

interface RecentJobsTableProps {
  jobs: UsageEvent[]
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-background rounded-xl border border-border shadow-sm p-8 text-center">
        <p className="text-muted text-sm">No jobs yet.</p>
        <p className="text-muted text-xs mt-1">
          Try processing some{' '}
          <Link href="/dashboard/text" className="underline text-foreground">text</Link> or{' '}
          <Link href="/dashboard/audio" className="underline text-foreground">audio</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Latency</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job._id}>
              <TableCell className="font-medium capitalize">{job.pipelineType}</TableCell>
              <TableCell className="text-muted text-sm">
                {formatBytes(job.inputBytes)} to {formatBytes(job.outputBytes)}
              </TableCell>
              <TableCell className="text-muted text-sm">{job.processingMs}ms</TableCell>
              <TableCell className="text-muted text-sm">
                {new Date(job.timestamp).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 3: Update dashboard page mock data**

In `dashboard/app/(app)/dashboard/page.tsx`, replace the import and mock data:

Replace:
```typescript
import type { UsageChartPoint, RecentActivity } from '@/types'
```
With:
```typescript
import type { UsageChartPoint, UsageEvent } from '@/types'
```

Replace the `MOCK_RECENT` array:
```typescript
const MOCK_RECENT: UsageEvent[] = [
  {
    _id: '1', idempotencyKey: 'job:1', userId: 'u1', jobId: 'j1',
    pipelineType: 'text', operations: ['trim', 'shorten'],
    inputBytes: 18432, outputBytes: 11264, processingMs: 1200,
    timestamp: '2026-03-17T14:32:00Z',
    text: { characterCount: 18000, wordCount: 3000, encoding: 'utf-8' },
  },
  {
    _id: '2', idempotencyKey: 'job:2', userId: 'u1', jobId: 'j2',
    pipelineType: 'audio', operations: ['normalize', 'compress'],
    inputBytes: 4404019, outputBytes: 2936013, processingMs: 8400,
    timestamp: '2026-03-17T13:15:00Z',
    audio: { durationMs: 180000, format: 'mp3', sampleRate: 44100, channels: 2 },
  },
  {
    _id: '3', idempotencyKey: 'job:3', userId: 'u1', jobId: 'j3',
    pipelineType: 'text', operations: ['shorten', 'minify'],
    inputBytes: 43008, outputBytes: 24576, processingMs: 2100,
    timestamp: '2026-03-17T11:58:00Z',
    text: { characterCount: 42000, wordCount: 7000, encoding: 'utf-8' },
  },
]
```

Also update the StatCard values to remove token-related labels:
```tsx
<StatCard label="Total Requests" value={347} />
<StatCard label="Data Processed" value="24.5 MB" description="total input across all jobs" />
<StatCard label="Data Saved" value="8.2 MB" description="total reduction in output size" />
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/types/index.ts dashboard/app/components/dashboard/RecentJobsTable.tsx dashboard/app/(app)/dashboard/page.tsx
git commit -m "refactor: update dashboard usage types and components for per-pipeline metering"
```

---

### Task 10: Update dashboard HTTP layer

**Files:**
- Modify: `dashboard/app/http/usage.ts`

- [ ] **Step 1: Update usage.ts to use new types**

Replace the entire file with:

```typescript
import { clientApi } from './api'
import type { ApiResponse, UsageAnalytics, CurrentUsage } from '@/types'

export const getUsageAnalytics = async (range: '7d' | '30d' | '90d' | '1y' = '30d') =>
  clientApi.get('usage/analytics', { searchParams: { range } }).json<ApiResponse<UsageAnalytics>>()

export const getCurrentUsage = async () =>
  clientApi.get('usage/current').json<ApiResponse<CurrentUsage>>()
```

Note: The function signatures stay the same — only the generic types they resolve to have changed.

- [ ] **Step 2: Commit**

```bash
git add dashboard/app/http/usage.ts
git commit -m "refactor: update dashboard usage HTTP layer for new types"
```

---

### Task 11: Verify everything compiles

- [ ] **Step 1: Check API compiles**

Run: `cd /Users/gustavonobregab/Programming/robin-monorepo/api && bunx tsc --noEmit 2>&1 | head -30`

Fix any type errors found.

- [ ] **Step 2: Check dashboard compiles**

Run: `cd /Users/gustavonobregab/Programming/robin-monorepo/dashboard && bunx tsc --noEmit 2>&1 | head -30`

Fix any type errors found (likely in dashboard page components that used old mock types like `RecentActivity`).

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type errors from usage metering migration"
```
