# Public API v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a versioned public API (`/v1`) authenticated via API keys, exposing audio/text processing, upload, and usage endpoints.

**Architecture:** A `v1/` directory under `api/src/` with its own middleware (API key auth + requestId), routes, and types. Routes are thin wrappers that delegate to existing services. Two existing services require minor changes: `keys.service.ts` (return keyId) and `job.service.ts` (ownership check on getStatus).

**Tech Stack:** Bun, Elysia, MongoDB (Mongoose), existing services

**Spec:** `docs/superpowers/specs/2026-03-23-public-api-v1-design.md`

---

### Task 1: Update `keys.service.ts` — return `keyId` from `validateApiKey`

**Files:**
- Modify: `api/src/modules/keys/keys.service.ts:70-88`

- [ ] **Step 1: Update validateApiKey return value**

In `api/src/modules/keys/keys.service.ts`, update the `validateApiKey` method to include `keyId` in the return:

```typescript
async validateApiKey(key: string) {
    if (!key) {
      throw new ApiError('API_KEY_REQUIRED', 'API key is required', 401);
    }

    const keyRecord = await ApiKeyModel.findOne({ key, status: 'active' });

    if (!keyRecord) {
      throw new ApiError('INVALID_API_KEY', 'Invalid or revoked API key', 401);
    }

    await ApiKeyModel.updateOne({ _id: keyRecord._id }, { lastUsedAt: new Date() });

    return {
      valid: true,
      userId: keyRecord.userId,
      keyName: keyRecord.name,
      keyId: keyRecord._id.toString(),
    };
  }
```

The only change is adding `keyId: keyRecord._id.toString()` to the return object.

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/keys/keys.service.ts
git commit -m "feat(keys): return keyId from validateApiKey"
```

---

### Task 2: Update `job.service.ts` — add ownership check to `getStatus`

**Files:**
- Modify: `api/src/modules/jobs/job.service.ts:20-30`
- Modify: `api/src/modules/audio/audio.routes.ts:37-38`
- Modify: `api/src/modules/text/text.routes.ts:35-36`

- [ ] **Step 1: Add userId parameter to getStatus**

In `api/src/modules/jobs/job.service.ts`, update `getStatus` to accept and filter by `userId`:

```typescript
async getStatus(userId: string, jobId: string): Promise<JobStatusView | null> {
    const doc = await JobModel.findOne({ _id: jobId, userId });
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      status: doc.status as Job['status'],
      error: doc.error ?? undefined,
      result: doc.result as JobStatusView['result'],
    };
  }
```

Changes: signature adds `userId` as first param, `findById(jobId)` becomes `findOne({ _id: jobId, userId })`.

**Note:** This is an intentional security tightening that also affects the dashboard routes — users will only be able to query their own jobs. The `userId` is available in dashboard route context from the `validateAuth` middleware.

- [ ] **Step 2: Update audio routes to pass userId**

In `api/src/modules/audio/audio.routes.ts`, update the job status route (line 37-38):

```typescript
  .get(
    '/jobs/:id',
    async ({ params: { id }, userId }) => {
      const job = await jobService.getStatus(userId, id);

      if (!job) {
        throw new ApiError('JOB_NOT_FOUND', 'Job not found', 404);
      }

      return job;
    },
```

Change: destructure `userId` from context, pass it as first arg to `getStatus`.

- [ ] **Step 3: Update text routes to pass userId**

In `api/src/modules/text/text.routes.ts`, update the job status route (line 35-36):

```typescript
  .get(
    '/jobs/:id',
    async ({ params: { id }, userId }) => {
      const job = await jobService.getStatus(userId, id);

      if (!job) {
        throw new ApiError('JOB_NOT_FOUND', 'Job not found', 404);
      }

      return job;
    },
```

Same change as audio routes.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/jobs/job.service.ts api/src/modules/audio/audio.routes.ts api/src/modules/text/text.routes.ts
git commit -m "feat(jobs): add ownership check to getStatus"
```

---

### Task 3: Create v1 middleware — `api.middleware.ts`

**Files:**
- Create: `api/src/v1/api.middleware.ts`

- [ ] **Step 1: Create the middleware**

Create `api/src/v1/api.middleware.ts`:

```typescript
import { Elysia } from 'elysia';
import { keysService } from '../modules/keys/keys.service';
import { ApiError } from '../utils/api-error';

export const apiKeyAuth = new Elysia({ name: 'api-key-auth' })
  .derive({ as: 'scoped' }, async ({ request, set }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw new ApiError('API_KEY_REQUIRED', 'Authorization header is required', 401);
    }

    if (!authHeader.startsWith('Bearer sk_live_')) {
      throw new ApiError('INVALID_API_KEY_FORMAT', 'Invalid API key format. Expected: Bearer sk_live_*', 401);
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const { userId, keyId } = await keysService.validateApiKey(apiKey);

    const requestId = `req_${crypto.randomUUID()}`;
    set.headers['X-Request-Id'] = requestId;

    return {
      userId,
      apiKeyId: keyId,
      requestId,
    };
  });
```

- [ ] **Step 2: Commit**

```bash
git add api/src/v1/api.middleware.ts
git commit -m "feat(v1): add API key auth middleware"
```

---

### Task 4: Create v1 routes — `api.routes.ts`

**Files:**
- Create: `api/src/v1/api.routes.ts`

- [ ] **Step 1: Create the routes file**

Create `api/src/v1/api.routes.ts`:

```typescript
import { Elysia, t } from 'elysia';
import { audioService } from '../modules/audio/audio.service';
import { textService } from '../modules/text/text.service';
import { uploadService } from '../modules/upload/upload.service';
import { usageService } from '../modules/usage/usage.service';
import { jobService } from '../modules/jobs/job.service';
import { AudioOperationSchema, AudioPresetSchema } from '../modules/audio/audio.types';
import { TextOperationSchema, TextPresetSchema } from '../modules/text/text.types';
import { ApiError } from '../utils/api-error';
import { UserModel } from '../modules/users/users.model';

export const apiRoutes = new Elysia()

  // ─── Audio ─────────────────────────────────────────
  .post(
    '/audio',
    async ({ body, userId }) => {
      const { job } = await audioService.processAudio(userId, body);
      return job;
    },
    {
      body: t.Object({
        audioId: t.String(),
        preset: t.Optional(AudioPresetSchema),
        operations: t.Optional(
          t.Array(AudioOperationSchema, { minItems: 1, maxItems: 10 })
        ),
      }),
    }
  )

  .get('/audio/jobs/:id', async ({ params: { id }, userId }) => {
    const job = await jobService.getStatus(userId, id);
    if (!job) throw new ApiError('JOB_NOT_FOUND', 'Job not found', 404);
    return job;
  })

  .get('/audio/presets', () => audioService.listPresets())

  .get('/audio/operations', () => audioService.listOperations())

  // ─── Text ──────────────────────────────────────────
  .post(
    '/text',
    async ({ body, userId }) => textService.processText(userId, body),
    {
      body: t.Object({
        text: t.Optional(t.String({ maxLength: 5_000_000 })),
        fileId: t.Optional(t.String()),
        preset: t.Optional(TextPresetSchema),
        operations: t.Optional(
          t.Array(TextOperationSchema, { minItems: 1, maxItems: 10 })
        ),
      }),
    }
  )

  .get('/text/jobs/:id', async ({ params: { id }, userId }) => {
    const job = await jobService.getStatus(userId, id);
    if (!job) throw new ApiError('JOB_NOT_FOUND', 'Job not found', 404);
    return job;
  })

  .get('/text/presets', () => textService.listPresets())

  .get('/text/operations', () => textService.listOperations())

  // ─── Upload ────────────────────────────────────────
  .post(
    '/upload',
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
    }
  )

  .post(
    '/upload/document',
    async ({ body, userId }) => {
      const { file } = body;
      return uploadService.uploadFile(userId, file);
    },
    {
      body: t.Object({
        file: t.File({ maxSize: '100m' }),
      }),
    }
  )

  // ─── Usage ─────────────────────────────────────────
  .get('/usage/current', async ({ userId }) => {
    const user = await UserModel.findOne({
      $or: [{ oderId: userId }, { _id: userId }],
    }).lean();

    const periodStart = user?.subscription?.currentPeriodStart;
    const periodEnd = user?.subscription?.currentPeriodEnd;

    return usageService.getCurrentUsage(userId, periodStart, periodEnd);
  });
```

- [ ] **Step 2: Commit**

```bash
git add api/src/v1/api.routes.ts
git commit -m "feat(v1): add all public API routes"
```

---

### Task 5: Create v1 entry point — `index.ts`

**Files:**
- Create: `api/src/v1/index.ts`
- Modify: `api/src/server.ts`

- [ ] **Step 1: Create the index file**

Create `api/src/v1/index.ts`:

```typescript
import { Elysia } from 'elysia';
import { apiKeyAuth } from './api.middleware';
import { apiRoutes } from './api.routes';

export const v1Routes = new Elysia({ prefix: '/v1' })
  .use(apiKeyAuth)
  .use(apiRoutes);
```

- [ ] **Step 2: Register v1Routes in server.ts**

In `api/src/server.ts`, add the import after the existing route imports (after line 16):

```typescript
const { v1Routes } = await import('./v1/index');
```

Add `.use(v1Routes)` after `.use(plansRoutes)`. The final block should look like:

```typescript
  .use(uploadRoutes)
  .use(plansRoutes)
  .use(v1Routes)
  app.listen(3002);
```

- [ ] **Step 3: Verify the server starts**

```bash
cd api && bun run dev
```

Expected: Server starts on port 3002 without errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/v1/index.ts api/src/server.ts
git commit -m "feat(v1): mount public API on /v1 prefix"
```

---

### Task 6: Manual smoke test

- [ ] **Step 1: Test auth rejection (no key)**

```bash
curl -s http://localhost:3002/v1/audio/presets | jq
```

Expected: `{ "success": false, "error": { "code": "API_KEY_REQUIRED", ... } }`

- [ ] **Step 2: Test auth rejection (bad key)**

```bash
curl -s -H "Authorization: Bearer bad_key" http://localhost:3002/v1/audio/presets | jq
```

Expected: `{ "success": false, "error": { "code": "INVALID_API_KEY_FORMAT", ... } }`

- [ ] **Step 3: Test with valid key (use an existing key from the database)**

```bash
curl -s -H "Authorization: Bearer sk_live_YOUR_KEY" http://localhost:3002/v1/audio/presets | jq
```

Expected: `{ "success": true, "data": [...] }` with `X-Request-Id` header.

- [ ] **Step 4: Test X-Request-Id header**

```bash
curl -sI -H "Authorization: Bearer sk_live_YOUR_KEY" http://localhost:3002/v1/audio/presets | grep -i x-request-id
```

Expected: `X-Request-Id: req_<uuid>`
