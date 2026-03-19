# Audio File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace URL-based audio input with direct multipart file upload to S3, with temporary storage and auto-delete.

**Architecture:** New `upload` module handles multipart file reception, validates format via magic bytes, uploads to S3, and returns an `audioId`. The existing `audio` module is updated to accept `audioId` instead of `audioUrl`, resolving it to an S3 reference. The worker downloads from S3 instead of fetching URLs, and uploads processed output back to S3 with presigned download URLs.

**Tech Stack:** Bun, Elysia, AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`), MongoDB (Mongoose), BullMQ

**Spec:** `docs/superpowers/specs/2026-03-19-audio-upload-design.md`

---

### Task 1: Install AWS SDK dependencies

**Files:**
- Modify: `api/package.json`

- [ ] **Step 1: Install packages**

```bash
cd api && bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner ulidx
```

- [ ] **Step 2: Verify installation**

```bash
cd api && bun run -e "import { S3Client } from '@aws-sdk/client-s3'; console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add api/package.json api/bun.lockb
git commit -m "chore: add @aws-sdk/client-s3, s3-request-presigner, and ulidx"
```

---

### Task 2: Create S3 storage config

**Files:**
- Create: `api/src/config/storage.ts`

- [ ] **Step 1: Create storage config**

Follow the pattern of `api/src/config/redis.ts` (read env, export client).

```typescript
// api/src/config/storage.ts
import { S3Client } from '@aws-sdk/client-s3';

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

export const S3_BUCKET = process.env.S3_BUCKET;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET) {
  throw new Error('AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET must be set');
}

export const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add api/src/config/storage.ts
git commit -m "feat: add S3 storage config"
```

---

### Task 3: Create upload model

**Files:**
- Create: `api/src/modules/upload/upload.model.ts`

- [ ] **Step 1: Create the Mongoose model**

Follow the pattern of `api/src/modules/jobs/job.model.ts`.

```typescript
// api/src/modules/upload/upload.model.ts
import { Schema, model } from 'mongoose';

const uploadSchema = new Schema(
  {
    userId: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true, enum: ['audio/mpeg', 'audio/wav'] },
    size: { type: Number, required: true },
    s3Key: { type: String, required: true },
    status: { type: String, enum: ['ready'], default: 'ready' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

uploadSchema.index({ userId: 1, createdAt: -1 });
uploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UploadModel = model('Upload', uploadSchema);
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/upload/upload.model.ts
git commit -m "feat: add Upload mongoose model with TTL index"
```

---

### Task 4: Create upload types

**Files:**
- Create: `api/src/modules/upload/upload.types.ts`

- [ ] **Step 1: Create upload types**

```typescript
// api/src/modules/upload/upload.types.ts

export type UploadDocument = {
  id: string;
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  status: 'ready';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UploadResponse = {
  id: string;
  originalName: string;
  size: number;
  expiresAt: string;
};

const MP3_SIGNATURES = [
  [0xff, 0xfb], // MPEG1 Layer 3
  [0xff, 0xf3], // MPEG2 Layer 3
  [0xff, 0xf2], // MPEG2.5 Layer 3
  [0xff, 0xfa], // MPEG1 Layer 3 with CRC
  [0x49, 0x44, 0x33], // ID3v2 tag
] as const;

const WAV_RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WAV_WAVE = [0x57, 0x41, 0x56, 0x45]; // "WAVE" at offset 8

export const ALLOWED_EXTENSIONS = ['.mp3', '.wav'] as const;
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function validateMagicBytes(buffer: Uint8Array): 'mp3' | 'wav' | null {
  // Check MP3 signatures
  for (const sig of MP3_SIGNATURES) {
    if (sig.every((byte, i) => buffer[i] === byte)) {
      return 'mp3';
    }
  }

  // Check WAV: RIFF header (bytes 0-3) + WAVE (bytes 8-11)
  const isRiff = WAV_RIFF.every((byte, i) => buffer[i] === byte);
  const isWave = buffer.length >= 12 && WAV_WAVE.every((byte, i) => buffer[8 + i] === byte);

  if (isRiff && isWave) {
    return 'wav';
  }

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/upload/upload.types.ts
git commit -m "feat: add upload types and magic bytes validation"
```

---

### Task 5: Create upload service

**Files:**
- Create: `api/src/modules/upload/upload.service.ts`

- [ ] **Step 1: Create upload service**

```typescript
// api/src/modules/upload/upload.service.ts
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3, S3_BUCKET } from '../../config/storage';
import { UploadModel } from './upload.model';
import { ApiError } from '../../utils/api-error';
import {
  validateMagicBytes,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  type UploadResponse,
} from './upload.types';
import { addHours } from 'date-fns';

const MIME_MAP: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

export class UploadService {
  async uploadAudio(userId: string, file: File): Promise<UploadResponse> {
    // Validate file exists
    if (!file) {
      throw new ApiError('MISSING_FILE', 'Audio file is required', 400);
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError('FILE_TOO_LARGE', `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, 413);
    }

    // Validate extension
    const ext = this.getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
      throw new ApiError('INVALID_FORMAT', `Only ${ALLOWED_EXTENSIONS.join(', ')} files are accepted`, 422);
    }

    // Validate magic bytes
    const buffer = new Uint8Array(await file.arrayBuffer());
    const detectedFormat = validateMagicBytes(buffer);

    if (!detectedFormat) {
      throw new ApiError('INVALID_FORMAT', 'File content does not match a valid audio format', 422);
    }

    // Upload to S3 (ULID for time-sortable, collision-safe IDs)
    const { ulid } = await import('ulidx');
    const uploadId = ulid();
    const s3Key = `uploads/${userId}/${uploadId}.${detectedFormat}`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: MIME_MAP[detectedFormat],
    }));

    // Create MongoDB document (only after successful S3 upload)
    const expiresAt = addHours(new Date(), 24);
    const doc = await UploadModel.create({
      userId,
      originalName: file.name,
      mimeType: MIME_MAP[detectedFormat],
      size: file.size,
      s3Key,
      status: 'ready',
      expiresAt,
    });

    return {
      id: doc._id.toString(),
      originalName: doc.originalName,
      size: doc.size,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getUpload(uploadId: string, userId: string) {
    if (!uploadId.match(/^[a-f0-9]{24}$/)) {
      throw new ApiError('UPLOAD_NOT_FOUND', 'Upload not found', 404);
    }

    const doc = await UploadModel.findById(uploadId);

    if (!doc || doc.userId !== userId) {
      throw new ApiError('UPLOAD_NOT_FOUND', 'Upload not found', 404);
    }

    if (doc.status !== 'ready') {
      throw new ApiError('UPLOAD_NOT_FOUND', 'Upload not found', 404);
    }

    if (doc.expiresAt < new Date()) {
      throw new ApiError('UPLOAD_EXPIRED', 'Upload has expired', 410);
    }

    return doc;
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
  }
}

export const uploadService = new UploadService();
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/upload/upload.service.ts
git commit -m "feat: add upload service with S3 upload and validation"
```

---

### Task 6: Create upload routes

**Files:**
- Create: `api/src/modules/upload/upload.routes.ts`

- [ ] **Step 1: Create upload routes**

```typescript
// api/src/modules/upload/upload.routes.ts
import { Elysia, t } from 'elysia';
import { validateAuth } from '../../middlewares/auth';
import { uploadService } from './upload.service';

export const uploadRoutes = new Elysia({ prefix: '/upload' })
  .use(validateAuth)
  .post(
    '/',
    async ({ body, userId }) => {
      const { audio } = body;
      return uploadService.uploadAudio(userId, audio);
    },
    {
      body: t.Object({
        audio: t.File({
          maxSize: '100m',
          type: ['audio/mpeg', 'audio/wav', 'audio/x-wav'],
        }),
      }),
      detail: {
        summary: 'Upload audio file',
        tags: ['Upload'],
      },
    }
  );
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/upload/upload.routes.ts
git commit -m "feat: add upload routes with multipart support"
```

---

### Task 7: Register upload routes in server

**Files:**
- Modify: `api/src/server.ts`

- [ ] **Step 1: Add upload routes import and registration**

Add after the existing audio import (line 10):

```typescript
const { uploadRoutes } = await import('./modules/upload/upload.routes');
```

Add `.use(uploadRoutes)` after `.use(audioRoutes)` (after line 27):

```typescript
  .use(uploadRoutes)
```

- [ ] **Step 2: Verify server starts**

```bash
cd api && bun run dev
```
Expected: Server starts without errors (will fail on missing AWS env vars — that's expected, just verify no syntax/import errors).

- [ ] **Step 3: Commit**

```bash
git add api/src/server.ts
git commit -m "feat: register upload routes in server"
```

---

### Task 8: Update audio types — remove audioUrl

**Files:**
- Modify: `api/src/modules/audio/audio.types.ts:146-150`

- [ ] **Step 1: Update ProcessAudioInput interface**

Replace the `ProcessAudioInput` interface at lines 146-150:

```typescript
// Before:
export interface ProcessAudioInput {
  audioUrl: string;
  preset?: AudioPreset;
  operations?: AudioOperation[];
}

// After:
export interface ProcessAudioInput {
  audioId: string;
  preset?: AudioPreset;
  operations?: AudioOperation[];
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/audio/audio.types.ts
git commit -m "refactor: replace audioUrl with audioId in ProcessAudioInput"
```

---

### Task 9: Update audio routes — accept audioId

**Files:**
- Modify: `api/src/modules/audio/audio.routes.ts:18-27`

- [ ] **Step 1: Update POST /audio body schema**

Replace the body schema (lines 18-27):

```typescript
// Before:
body: t.Object({
  audioUrl: t.String({ format: 'uri' }),
  preset: t.Optional(AudioPresetSchema),
  operations: t.Optional(
    t.Array(AudioOperationSchema, {
      minItems: 1,
      maxItems: 10,
    })
  ),
}),

// After:
body: t.Object({
  audioId: t.String(),
  preset: t.Optional(AudioPresetSchema),
  operations: t.Optional(
    t.Array(AudioOperationSchema, {
      minItems: 1,
      maxItems: 10,
    })
  ),
}),
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/audio/audio.routes.ts
git commit -m "refactor: accept audioId instead of audioUrl in POST /audio"
```

---

### Task 10: Update job.types.ts — narrow AudioJobPayload source

**Files:**
- Modify: `api/src/modules/jobs/job.types.ts:25-31`

- [ ] **Step 1: Narrow AudioJobPayload source type**

Keep `JobSource` union unchanged (shared by text/image). Only narrow `AudioJobPayload`:

```typescript
// Before:
export type AudioJobPayload = {
  type: "audio";
  preset?: AudioPreset;
  source: JobSource;
  operations: AudioOperation[];
  name?: string;
};

// After:
export type AudioJobPayload = {
  type: "audio";
  preset?: AudioPreset;
  source: { kind: "storage"; ref: string };
  operations: AudioOperation[];
  name?: string;
};
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/jobs/job.types.ts
git commit -m "refactor: narrow AudioJobPayload source to storage-only"
```

---

### Task 11: Update audio service — resolve audioId to S3 ref

**Files:**
- Modify: `api/src/modules/audio/audio.service.ts`

- [ ] **Step 1: Update processAudio method**

Replace the entire `processAudio` method:

```typescript
// Before:
async processAudio(userId: string, input: ProcessAudioInput): Promise<{ job: Job }> {
  const { preset, operations: customOps, audioUrl } = input;

  if (!preset && (!customOps || customOps.length === 0)) {
    throw new ApiError(
      'AUDIO_INVALID_INPUT',
      'Either preset or operations must be provided',
      400
    );
  }

  const operations = this.resolveOperations(preset, customOps);

  const job = await jobService.create({ userId,
   payload:
   { type: 'audio',
     preset,
     operations,
     source: { kind: 'url', url: audioUrl },
     name: audioUrl,
   } });

  await jobService.enqueue(job);

  return { job };
}

// After:
async processAudio(userId: string, input: ProcessAudioInput): Promise<{ job: Job }> {
  const { preset, operations: customOps, audioId } = input;

  if (!preset && (!customOps || customOps.length === 0)) {
    throw new ApiError(
      'AUDIO_INVALID_INPUT',
      'Either preset or operations must be provided',
      400
    );
  }

  // Resolve audioId to upload document — validates ownership and expiry
  const upload = await uploadService.getUpload(audioId, userId);

  const operations = this.resolveOperations(preset, customOps);

  const job = await jobService.create({ userId,
   payload:
   { type: 'audio',
     preset,
     operations,
     source: { kind: 'storage', ref: upload.s3Key },
     name: upload.originalName,
   } });

  await jobService.enqueue(job);

  return { job };
}
```

Add the import at the top of the file:

```typescript
import { uploadService } from '../upload/upload.service';
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/audio/audio.service.ts
git commit -m "refactor: resolve audioId via upload service instead of using audioUrl"
```

---

### Task 12: Update worker — download from S3 and upload output

**Files:**
- Modify: `api/src/worker/audio.processor.ts`

- [ ] **Step 1: Replace fetch with S3 GetObject and add output upload**

Replace the entire file:

```typescript
// api/src/worker/audio.processor.ts
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import type { Job } from 'bullmq';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AudioQueueJob } from '../queues/audio.queue';
import type { AudioJobPayload } from '../modules/jobs/job.types';
import { JobModel } from '../modules/jobs/job.model';
import { processAudioFile } from './audio/pipeline';
import { s3, S3_BUCKET } from '../config/storage';

const HOURS_72 = 72 * 60 * 60; // seconds

const log = (jobId: string, msg: string) => console.log(`[AUDIO:${jobId}] ${msg}`);

export default async function (job: Job<AudioQueueJob>) {
  const { data } = job.data;
  const id = data.jobId;

  log(id, 'Starting');

  const jobDoc = await JobModel.findById(id);

  if (!jobDoc) {
    throw new Error(`Job ${id} not found`);
  }

  const payload = jobDoc.payload as unknown as AudioJobPayload;

  log(id, `Operations: ${payload.operations.map((op) => op.type).join(' -> ')}`);

  await JobModel.findByIdAndUpdate(id, { status: 'processing' });

  const workDir = await mkdtemp(join(tmpdir(), 'rw-audio-'));
  const inputPath = join(workDir, 'input');
  const outputPath = join(workDir, 'output.mp3');

  try {
    // Download from S3
    const s3Key = payload.source.ref;
    log(id, `Downloading from S3: ${s3Key}`);

    const response = await s3.send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    }));

    if (!response.Body) {
      throw new Error('Empty response from S3');
    }

    const buffer = await response.Body.transformToByteArray();
    await Bun.write(inputPath, buffer);
    const inputSize = buffer.byteLength;
    log(id, `Downloaded ${(inputSize / 1024 / 1024).toFixed(2)}MB`);

    // Process
    log(id, 'Processing pipeline...');
    await processAudioFile(inputPath, outputPath, payload.operations);

    const outputFile = Bun.file(outputPath);
    const outputSize = outputFile.size;

    const ratio = (inputSize / outputSize).toFixed(2);
    log(id, `Done — ${(inputSize / 1024 / 1024).toFixed(2)}MB to ${(outputSize / 1024 / 1024).toFixed(2)}MB (ratio: ${ratio}x)`);

    // Upload output to S3
    const outputKey = `outputs/${id}/result.mp3`;
    const outputBuffer = await outputFile.arrayBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: outputKey,
      Body: new Uint8Array(outputBuffer),
      ContentType: 'audio/mpeg',
    }));

    log(id, `Uploaded output to S3: ${outputKey}`);

    // Generate presigned URL — 72h from now (effectively aligned with S3 lifecycle
    // since this runs immediately after PutObject; the object and URL expire ~same time)
    const outputUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: outputKey }),
      { expiresIn: HOURS_72 }
    );

    await JobModel.findByIdAndUpdate(id, {
      status: 'completed',
      completedAt: new Date(),
      result: {
        outputUrl,
        metrics: {
          inputSize,
          outputSize,
          compressionRatio: +ratio,
          operationsApplied: payload.operations.map((op) => op.type),
        },
      },
    });
  } catch (err) {
    log(id, `Failed: ${err instanceof Error ? err.message : err}`);
    await JobModel.findByIdAndUpdate(id, {
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    throw err;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/worker/audio.processor.ts
git commit -m "feat: worker downloads from S3 and uploads output with presigned URL"
```

---

### Task 13: Cleanup — remove unused audioUrl import from audio.routes.ts

**Files:**
- Modify: `api/src/modules/audio/audio.routes.ts`

- [ ] **Step 1: Verify no remaining audioUrl references**

```bash
cd api && grep -r "audioUrl" src/
```
Expected: No matches.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd api && bunx tsc --noEmit
```
Expected: No type errors.

- [ ] **Step 3: Commit (if any cleanup was needed)**

```bash
git add -A api/src/
git commit -m "chore: remove remaining audioUrl references"
```

---

### Task 14: Final integration verification

- [ ] **Step 1: Verify all imports resolve**

```bash
cd api && bunx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 2: Verify server starts**

```bash
cd api && timeout 5 bun run dev || true
```
Expected: Server starts (may warn about missing AWS env vars).

- [ ] **Step 3: Final commit (if needed)**

```bash
git add -A
git commit -m "feat: complete audio upload implementation"
```

---

### Task 15: Configure S3 bucket lifecycle rules (manual/infra)

> **Note:** This is an infrastructure task, not application code. Must be done before deploying to production.

- [ ] **Step 1: Configure S3 lifecycle rules on the bucket**

Two lifecycle rules are required:

| Prefix | Action | After |
|--------|--------|-------|
| `uploads/` | Delete objects | 24 hours |
| `outputs/` | Delete objects | 72 hours |

Via AWS CLI:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket $S3_BUCKET \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "delete-uploads-24h",
        "Prefix": "uploads/",
        "Status": "Enabled",
        "Expiration": { "Days": 1 }
      },
      {
        "ID": "delete-outputs-72h",
        "Prefix": "outputs/",
        "Status": "Enabled",
        "Expiration": { "Days": 3 }
      }
    ]
  }'
```

- [ ] **Step 2: Verify lifecycle rules are active**

```bash
aws s3api get-bucket-lifecycle-configuration --bucket $S3_BUCKET
```
