# Robin Wood — Monorepo

## Structure

```
robin-wood-api/
├── api/          # Backend — Elysia + Bun
├── dashboard/    # Frontend (in progress)
└── package.json  # Workspace root
```

## Running

From the repo root:

```bash
bun run dev           # API dev server
bun run dev:dashboard # Dashboard dev server
bun run worker        # BullMQ worker
bun run seed          # Seed API keys
```

Or inside each workspace directly:

```bash
cd api && bun run dev
```

## API (`api/`)

**Stack:** Bun, Elysia, MongoDB (Mongoose), Redis (ioredis), BullMQ, better-auth, Anthropic SDK

**Source layout:**

```
api/src/
├── config/       # DB, Redis, Auth setup (database.ts, redis.ts, auth.ts)
├── middlewares/  # Elysia middleware (api-key.ts, idempotency.ts)
├── modules/      # Feature modules (see below)
├── queues/       # BullMQ queue definitions
├── utils/        # Shared helpers
├── worker/       # BullMQ worker entrypoint
└── server.ts     # App entrypoint
```

## File Naming

- **kebab-case** for all files and directories
- Module files follow `<module>.<layer>.ts` pattern:
  - `users.routes.ts` — Elysia route definitions
  - `users.service.ts` — business logic
  - `users.model.ts` — Mongoose model/schema
  - `users.types.ts` — TypeScript types/interfaces for that module
- Config files: single word (`database.ts`, `redis.ts`, `auth.ts`)
- Middleware files: single concept (`api-key.ts`, `idempotency.ts`)

## Module Structure

Each feature lives under `api/src/modules/<name>/`:

```
modules/users/
├── users.routes.ts
├── users.service.ts
├── users.model.ts
└── users.types.ts
```

Not every module needs all four files — add only what's needed.
