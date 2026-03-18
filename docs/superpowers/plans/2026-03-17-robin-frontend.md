# Robin Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Robin frontend — landing page, auth, and dashboard with text/audio/image tool pages — inside the existing `dashboard/` workspace.

**Architecture:** Next.js 15 App Router with three route groups: `(public)` for the landing page, `(auth)` for sign-in/sign-up, and `(app)` for the authenticated dashboard. HTTP calls go through typed `ky` wrappers in `app/http/`, data is fetched with SWR, and all shared TypeScript types live in `types/index.ts`. Auth is handled by better-auth (the API already has it set up at `GET|POST /api/auth/*`).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui (Radix UI), SWR, ky, better-auth, Framer Motion, Sonner, Recharts, Vitest, React Testing Library

---

## ⚠️ Conventions (from `dashboard/CLAUDE.md`)

- **PascalCase** for component files (`Sidebar.tsx`, `StatCard.tsx`)
- **kebab-case** for directories (`(auth)/`, `landing/`)
- **camelCase** for hooks, utils, and http modules (`use-api-key.ts`, `keys.ts`)
- Never call `clientApi` or `api` directly in components — always wrap in `app/http/<module>.ts`
- All shared types live in `types/index.ts` only
- **Data fetching: SWR** — `dashboard/CLAUDE.md` specifies SWR; this takes precedence over the spec's mention of TanStack Query. All data fetching in this plan uses SWR.
- **Route groups:** `(public)` = marketing, `(auth)` = sign-in/up, `(app)` = authenticated dashboard. Note: `dashboard/CLAUDE.md` uses `(auth)` for authenticated routes and `(public)` for public — this plan renames the authenticated group to `(app)` to avoid confusion with the sign-in/up `(auth)` group.

---

## File Map

```
dashboard/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx                  # Navbar + Footer shell
│   │   └── page.tsx                    # Landing page assembly
│   ├── (auth)/
│   │   ├── layout.tsx                  # Centered card layout
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                  # Sidebar + Topbar shell
│   │   └── dashboard/
│   │       ├── page.tsx                # Overview
│   │       ├── text/page.tsx
│   │       ├── audio/page.tsx
│   │       ├── image/page.tsx
│   │       ├── keys/page.tsx
│   │       ├── billing/page.tsx
│   │       └── account/page.tsx
│   ├── http/
│   │   ├── api.ts                      # ky instances (api + clientApi)
│   │   ├── usage.ts
│   │   ├── jobs.ts
│   │   ├── keys.ts
│   │   ├── text.ts
│   │   └── audio.ts
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── Footer.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── NavItem.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── RecentJobsTable.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── UsageChart.tsx
│   │   └── tools/
│   │       ├── ToolLayout.tsx
│   │       ├── PresetSelector.tsx
│   │       ├── UrlInput.tsx
│   │       └── MetricsPanel.tsx
│   ├── hooks/
│   │   ├── use-api-key.ts
│   │   └── use-job-poll.ts
│   ├── lib/
│   │   ├── utils.ts                    # cn(), maskKey(), formatBytes()
│   │   └── auth-client.ts              # better-auth client
│   ├── providers.tsx                   # SWR + Sonner wrapper (client component)
│   ├── layout.tsx                      # Root layout (fonts, providers)
│   └── globals.css
├── types/
│   └── index.ts                        # ALL shared TypeScript types
├── middleware.ts                       # Protect /dashboard/* routes
├── tailwind.config.ts
├── components.json                     # shadcn config
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── vitest.setup.ts
└── package.json
```

---

## Task 1: Initialize Next.js 15 project

**Files:**
- Modify: `dashboard/package.json`
- Create: `dashboard/next.config.ts`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/postcss.config.mjs`
- Create: `dashboard/.env.local`

- [ ] **Step 1: Replace placeholder package.json**

```json
{
  "name": "dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3333",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ky": "^1.7.4",
    "swr": "^2.3.3",
    "better-auth": "^1.2.7",
    "framer-motion": "^12.5.0",
    "sonner": "^2.0.1",
    "recharts": "^2.15.0",
    "lucide-react": "^0.483.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.2",
    "class-variance-authority": "^0.7.1",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^3.4.17",
    "postcss": "^8",
    "autoprefixer": "^10.0.1",
    "eslint": "^9",
    "eslint-config-next": "^15.2.0",
    "vitest": "^3.0.9",
    "@vitejs/plugin-react": "^4.3.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.1.0"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

```ts
// dashboard/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create postcss.config.mjs**

```js
/** @type {import('postcss').Config} */
const config = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
export default config
```

- [ ] **Step 5: Create .env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

- [ ] **Step 6: Install dependencies**

```bash
cd dashboard && bun install
```

Expected: `node_modules` created, no errors.

- [ ] **Step 7: Create minimal app/layout.tsx and app/page.tsx to verify Next.js starts**

`dashboard/app/layout.tsx`:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

`dashboard/app/page.tsx`:
```tsx
export default function Page() {
  return <div>Robin</div>
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
cd dashboard && bun run dev
```

Expected: `ready - started server on http://localhost:3333`

- [ ] **Step 9: Commit**

```bash
git add dashboard/
git commit -m "feat: initialize Next.js 15 dashboard workspace"
```

---

## Task 2: Configure Tailwind and global styles

**Files:**
- Create: `dashboard/tailwind.config.ts`
- Create: `dashboard/app/globals.css`

- [ ] **Step 1: Create tailwind.config.ts**

```ts
// dashboard/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './app/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFDF6',
        'background-section': '#FAF6E9',
        'accent-light': '#DDEB9D',
        'accent-strong': '#A0C878',
        foreground: '#111111',
        muted: '#444444',
        border: '#E8E4D8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Create globals.css**

```css
/* dashboard/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    border-color: theme('colors.border');
  }
  body {
    background-color: theme('colors.background');
    color: theme('colors.foreground');
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 3: Import globals.css in root layout**

```tsx
// dashboard/app/layout.tsx
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Verify styles load**

Run `bun run dev`, open browser at `http://localhost:3333`. Body should use Inter font and `#FFFDF6` background.

- [ ] **Step 5: Commit**

```bash
git add dashboard/tailwind.config.ts dashboard/app/globals.css dashboard/app/layout.tsx
git commit -m "feat: configure Tailwind design tokens and Inter font"
```

---

## Task 3: Set up shadcn/ui

**Files:**
- Create: `dashboard/components.json`
- Create: `dashboard/app/components/ui/` (auto-generated by shadcn CLI)

- [ ] **Step 1: Create components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": false
  },
  "aliases": {
    "components": "@/app/components",
    "utils": "@/app/lib/utils",
    "ui": "@/app/components/ui"
  }
}
```

- [ ] **Step 2: Create app/lib/utils.ts (required by shadcn)**

```ts
// dashboard/app/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskKey(key: string): string {
  if (key.length <= 12) return key
  return key.slice(0, 12) + '…'
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}
```

- [ ] **Step 3: Install shadcn components**

```bash
cd dashboard
bunx shadcn@latest add button input label textarea select dialog alert-dialog tooltip table badge card separator dropdown-menu avatar skeleton sonner radio-group
```

When prompted about the install path, confirm defaults. This will populate `app/components/ui/`.

- [ ] **Step 4: Verify**

```bash
ls app/components/ui/
```

Expected: `button.tsx`, `input.tsx`, `dialog.tsx`, etc.

- [ ] **Step 5: Commit**

```bash
git add dashboard/components.json dashboard/app/components/ui/ dashboard/app/lib/utils.ts
git commit -m "feat: set up shadcn/ui components and utils"
```

---

## Task 4: Set up Vitest + React Testing Library

**Files:**
- Create: `dashboard/vitest.config.ts`
- Create: `dashboard/vitest.setup.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
// dashboard/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 2: Create vitest.setup.ts**

```ts
// dashboard/vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Write a smoke test to verify setup**

Create `dashboard/app/lib/__tests__/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { maskKey, formatBytes } from '../utils'

describe('maskKey', () => {
  it('truncates key to 12 chars + ellipsis', () => {
    expect(maskKey('sk_live_a1b2c3d4e5f6g7h8')).toBe('sk_live_a1b2…')
  })

  it('returns short keys unchanged', () => {
    expect(maskKey('short')).toBe('short')
  })
})

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1048576)).toBe('1.0 MB')
  })
})
```

- [ ] **Step 4: Run tests to verify they fail (utils not yet matching)**

```bash
cd dashboard && bun run test:run
```

Expected: Tests run and PASS (utils.ts already created in Task 3 Step 2).

- [ ] **Step 5: Commit**

```bash
git add dashboard/vitest.config.ts dashboard/vitest.setup.ts dashboard/app/lib/__tests__/
git commit -m "feat: set up Vitest + RTL test environment"
```

---

## Task 5: TypeScript types

**Files:**
- Create: `dashboard/types/index.ts`
- Test: `dashboard/types/__tests__/types.test.ts` (compile-time only — no runtime test needed, just import check)

- [ ] **Step 1: Create types/index.ts**

```ts
// dashboard/types/index.ts

// ─── Generic API wrapper ──────────────────────────────────────
export type ApiResponse<T> = { data: T }

// ─── Jobs ────────────────────────────────────────────────────
export type JobStatus = 'created' | 'pending' | 'processing' | 'completed' | 'failed'

export interface JobMetrics {
  inputSize: number
  outputSize: number
  compressionRatio: number
  operationsApplied: string[]
}

export interface Job {
  _id: string
  userId: string
  status: JobStatus
  payload: {
    type: 'audio' | 'text'
    operations: object[]
    preset?: string
  }
  result?: {
    outputUrl?: string
    metrics?: JobMetrics
  }
  error?: string
  completedAt?: string
  createdAt: string
}

// ─── Usage ───────────────────────────────────────────────────
export interface UsageStats {
  totalRequests: number
  tokensSaved: number
  tokensUsed: number
}

export interface UsageChartPoint {
  date: string
  requests: number
}

export interface UsageBreakdownItem {
  type: string
  count: number
  percentage: number
}

export interface RecentActivity {
  id: string
  type: string
  status: string
  size: string
  latency: string
  timestamp: string
}

export interface UsageAnalytics {
  stats: UsageStats
  chart: UsageChartPoint[]
  breakdown: UsageBreakdownItem[]
  recent: RecentActivity[]
}

export interface CurrentUsage {
  tokensLimit: number
  tokensUsed: number
  tokensRemaining: number
}

// ─── API Keys ────────────────────────────────────────────────
export type KeyStatus = 'active' | 'revoked'

export interface ApiKey {
  _id: string
  name: string
  key: string
  status: KeyStatus
  createdAt: string
  lastUsedAt?: string
}

// ─── Text ────────────────────────────────────────────────────
export type TextPreset = 'chill' | 'medium' | 'aggressive'

export interface SubmitTextJobInput {
  textUrl: string
  preset: TextPreset
}

// ─── Audio ───────────────────────────────────────────────────
export type AudioPreset = 'chill' | 'medium' | 'aggressive' | 'podcast' | 'lecture'

export interface SubmitAudioJobInput {
  audioUrl: string
  preset: AudioPreset
}

// ─── Auth ─────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd dashboard && bunx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/types/
git commit -m "feat: add shared TypeScript types"
```

---

## Task 6: HTTP layer

**Files:**
- Create: `dashboard/app/http/api.ts`
- Create: `dashboard/app/http/usage.ts`
- Create: `dashboard/app/http/jobs.ts`
- Create: `dashboard/app/http/keys.ts`
- Create: `dashboard/app/http/text.ts`
- Create: `dashboard/app/http/audio.ts`
- Test: `dashboard/app/http/__tests__/keys.test.ts`

- [ ] **Step 1: Create app/http/api.ts**

```ts
// dashboard/app/http/api.ts
import ky from 'ky'

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
})

export const clientApi = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        if (typeof window === 'undefined') return
        const apiKey = localStorage.getItem('robin_api_key')
        if (apiKey) request.headers.set('X-API-Key', apiKey)
      },
    ],
  },
})
```

- [ ] **Step 2: Create app/http/usage.ts**

```ts
// dashboard/app/http/usage.ts
import { clientApi } from './api'
import type { ApiResponse, UsageAnalytics, CurrentUsage } from '@/types'

export const getUsageAnalytics = (range: '7d' | '30d' | '90d' | '1y' = '30d') =>
  clientApi.get('usage/analytics', { searchParams: { range } }).json<ApiResponse<UsageAnalytics>>()

export const getCurrentUsage = () =>
  clientApi.get('usage/current').json<ApiResponse<CurrentUsage>>()
```

- [ ] **Step 3: Create app/http/jobs.ts**

```ts
// dashboard/app/http/jobs.ts
import { clientApi } from './api'
import type { ApiResponse, Job } from '@/types'

export const getTextJobStatus = (id: string) =>
  clientApi.get(`text/jobs/${id}`).json<ApiResponse<Job>>()

export const getAudioJobStatus = (id: string) =>
  clientApi.get(`audio/jobs/${id}`).json<ApiResponse<Job>>()
```

- [ ] **Step 4: Create app/http/keys.ts**

```ts
// dashboard/app/http/keys.ts
import { clientApi } from './api'
import type { ApiResponse, ApiKey } from '@/types'

export const getApiKeys = () =>
  clientApi.get('keys').json<ApiResponse<ApiKey[]>>()

export const createApiKey = (name: string) =>
  clientApi.post('keys', { json: { name } }).json<ApiResponse<ApiKey>>()

export const revokeApiKey = (id: string) =>
  clientApi.delete(`keys/${id}`).json<ApiResponse<{ revoked: boolean }>>()
```

- [ ] **Step 5: Create app/http/text.ts**

```ts
// dashboard/app/http/text.ts
import { clientApi } from './api'
import type { ApiResponse, Job, SubmitTextJobInput } from '@/types'

export const submitTextJob = (input: SubmitTextJobInput) =>
  clientApi.post('text', { json: input }).json<ApiResponse<Job>>()
```

- [ ] **Step 6: Create app/http/audio.ts**

```ts
// dashboard/app/http/audio.ts
import { clientApi } from './api'
import type { ApiResponse, Job, SubmitAudioJobInput } from '@/types'

export const submitAudioJob = (input: SubmitAudioJobInput) =>
  clientApi.post('audio', { json: input }).json<ApiResponse<Job>>()
```

- [ ] **Step 7: Write test for keys.ts**

Create `dashboard/app/http/__tests__/keys.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ky before importing the module under test
vi.mock('ky', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  }
  const mockJson = vi.fn()
  mockInstance.get.mockReturnValue({ json: mockJson })
  mockInstance.post.mockReturnValue({ json: mockJson })
  mockInstance.delete.mockReturnValue({ json: mockJson })
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
    __mockInstance: mockInstance,
    __mockJson: mockJson,
  }
})

describe('keys http module', () => {
  it('getApiKeys calls GET keys', async () => {
    const ky = await import('ky')
    const { __mockInstance, __mockJson } = ky as any
    __mockJson.mockResolvedValueOnce({ data: [] })
    const { getApiKeys } = await import('../keys')
    await getApiKeys()
    expect(__mockInstance.get).toHaveBeenCalledWith('keys')
  })

  it('createApiKey calls POST keys with name', async () => {
    const ky = await import('ky')
    const { __mockInstance, __mockJson } = ky as any
    __mockJson.mockResolvedValueOnce({ data: {} })
    const { createApiKey } = await import('../keys')
    await createApiKey('my-key')
    expect(__mockInstance.post).toHaveBeenCalledWith('keys', { json: { name: 'my-key' } })
  })

  it('revokeApiKey calls DELETE keys/:id', async () => {
    const ky = await import('ky')
    const { __mockInstance, __mockJson } = ky as any
    __mockJson.mockResolvedValueOnce({ data: { revoked: true } })
    const { revokeApiKey } = await import('../keys')
    await revokeApiKey('abc123')
    expect(__mockInstance.delete).toHaveBeenCalledWith('keys/abc123')
  })
})
```

- [ ] **Step 8: Run tests**

```bash
cd dashboard && bun run test:run
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add dashboard/app/http/
git commit -m "feat: add typed HTTP layer (ky instances + domain modules)"
```

---

## Task 7: Auth client and custom hooks

**Files:**
- Create: `dashboard/app/lib/auth-client.ts`
- Create: `dashboard/app/hooks/use-api-key.ts`
- Create: `dashboard/app/hooks/use-job-poll.ts`
- Test: `dashboard/app/hooks/__tests__/use-api-key.test.ts`

- [ ] **Step 1: Create app/lib/auth-client.ts**

```ts
// dashboard/app/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
```

- [ ] **Step 2: Create app/hooks/use-api-key.ts**

This hook reads/writes the API key from localStorage and tells the rest of the app whether a key is configured.

```ts
// dashboard/app/hooks/use-api-key.ts
'use client'
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'robin_api_key'

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null)

  useEffect(() => {
    setApiKeyState(localStorage.getItem(STORAGE_KEY))
  }, [])

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key)
    setApiKeyState(key)
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState(null)
  }, [])

  return { apiKey, hasKey: apiKey !== null, setApiKey, clearApiKey }
}
```

- [ ] **Step 3: Write failing test for use-api-key**

Create `dashboard/app/hooks/__tests__/use-api-key.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useApiKey } from '../use-api-key'

beforeEach(() => localStorage.clear())

describe('useApiKey', () => {
  it('returns null when no key is set', () => {
    const { result } = renderHook(() => useApiKey())
    expect(result.current.apiKey).toBeNull()
    expect(result.current.hasKey).toBe(false)
  })

  it('sets and reads a key from localStorage', () => {
    const { result } = renderHook(() => useApiKey())
    act(() => result.current.setApiKey('sk_live_test123'))
    expect(result.current.apiKey).toBe('sk_live_test123')
    expect(result.current.hasKey).toBe(true)
    expect(localStorage.getItem('robin_api_key')).toBe('sk_live_test123')
  })

  it('clears the key', () => {
    const { result } = renderHook(() => useApiKey())
    act(() => result.current.setApiKey('sk_live_test123'))
    act(() => result.current.clearApiKey())
    expect(result.current.apiKey).toBeNull()
    expect(localStorage.getItem('robin_api_key')).toBeNull()
  })
})
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd dashboard && bun run test:run
```

Expected: PASS.

- [ ] **Step 5: Create app/hooks/use-job-poll.ts**

Polls a job status endpoint every 2 seconds until completed/failed or 5 min timeout.

```ts
// dashboard/app/hooks/use-job-poll.ts
'use client'
import useSWR from 'swr'
import { useRef } from 'react'
import type { Job } from '@/types'
import type { ApiResponse } from '@/types'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 150 // 5 minutes

interface UseJobPollOptions {
  jobId: string | null
  fetcher: (id: string) => Promise<ApiResponse<Job>>
}

export function useJobPoll({ jobId, fetcher }: UseJobPollOptions) {
  const pollCount = useRef(0)

  const isTerminal = (status?: string) =>
    status === 'completed' || status === 'failed'

  const { data, error } = useSWR<ApiResponse<Job>>(
    jobId ? `job-poll-${jobId}` : null,
    () => fetcher(jobId!),
    {
      refreshInterval: (latestData) => {
        if (!latestData) return POLL_INTERVAL_MS
        if (isTerminal(latestData.data.status)) return 0
        pollCount.current += 1
        if (pollCount.current >= MAX_POLLS) return 0
        return POLL_INTERVAL_MS
      },
      revalidateOnFocus: false,
    }
  )

  const job = data?.data
  const timedOut = pollCount.current >= MAX_POLLS && !isTerminal(job?.status)

  return {
    job,
    isPolling: !!jobId && !isTerminal(job?.status) && !timedOut,
    isCompleted: job?.status === 'completed',
    isFailed: job?.status === 'failed',
    timedOut,
    error,
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add dashboard/app/lib/auth-client.ts dashboard/app/hooks/
git commit -m "feat: add auth client and hooks (use-api-key, use-job-poll)"
```

---

## Task 8: Next.js middleware

**Files:**
- Create: `dashboard/middleware.ts`

- [ ] **Step 1: Create middleware.ts**

```ts
// dashboard/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // better-auth sets a session cookie; check for its presence
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('__Secure-better-auth.session_token')

    if (!sessionCookie) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/middleware.ts
git commit -m "feat: add Next.js middleware to protect dashboard routes"
```

---

## Task 9: Root layout and providers

**Files:**
- Create: `dashboard/app/providers.tsx`
- Modify: `dashboard/app/layout.tsx`

- [ ] **Step 1: Create app/providers.tsx**

```tsx
// dashboard/app/providers.tsx
'use client'
import { SWRConfig } from 'swr'
import { Toaster } from '@/app/components/ui/sonner'
import { authClient } from '@/app/lib/auth-client'

// authClient.SessionProvider is required for useSession() to work anywhere in the app
const { SessionProvider } = authClient

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          errorRetryCount: 2,
        }}
      >
        {children}
        <Toaster richColors position="top-right" />
      </SWRConfig>
    </SessionProvider>
  )
}
```

- [ ] **Step 2: Update app/layout.tsx**

```tsx
// dashboard/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Robin',
  description: 'Compress text, audio, and images',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

Note: When using `next/font/google`, remove the Google Fonts `@import` from `globals.css` to avoid double-loading.

- [ ] **Step 3: Remove @import from globals.css**

Delete the first line (`@import url('https://fonts.googleapis.com/...')`) from `dashboard/app/globals.css`.

- [ ] **Step 4: Commit**

```bash
git add dashboard/app/providers.tsx dashboard/app/layout.tsx dashboard/app/globals.css
git commit -m "feat: add SWR provider and root layout with Inter font"
```

---

## Task 10: Marketing layout and Navbar

**Files:**
- Create: `dashboard/app/(public)/layout.tsx`
- Create: `dashboard/app/components/landing/Navbar.tsx`
- Create: `dashboard/app/components/landing/Footer.tsx`

- [ ] **Step 1: Create the Navbar component**

```tsx
// dashboard/app/components/landing/Navbar.tsx
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Robin
        </Link>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">Docs</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light" asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create the Footer component**

```tsx
// dashboard/app/components/landing/Footer.tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-background-section border-t border-border">
      <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between text-sm text-muted">
        <span className="font-semibold text-foreground">Robin</span>
        <div className="flex gap-6">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
        </div>
        <span>© {new Date().getFullYear()} Robin</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Create (public)/layout.tsx**

```tsx
// dashboard/app/(public)/layout.tsx
import { Navbar } from '@/app/components/landing/Navbar'
import { Footer } from '@/app/components/landing/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/app/(public)/ dashboard/app/components/landing/Navbar.tsx dashboard/app/components/landing/Footer.tsx
git commit -m "feat: add marketing layout with Navbar and Footer"
```

---

## Task 11: Landing page sections

**Files:**
- Create: `dashboard/app/components/landing/Hero.tsx`
- Create: `dashboard/app/components/landing/Features.tsx`
- Create: `dashboard/app/components/landing/HowItWorks.tsx`
- Create: `dashboard/app/components/landing/Pricing.tsx`
- Create: `dashboard/app/(public)/page.tsx`

- [ ] **Step 1: Create Hero.tsx**

```tsx
// dashboard/app/components/landing/Hero.tsx
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'

export function Hero() {
  return (
    <section className="bg-background py-24">
      <div className="max-w-6xl mx-auto px-8 text-center">
        <Badge className="mb-6 bg-accent-light text-foreground border-0 rounded-full px-4 py-1">
          Text · Audio · Image
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Compress everything.<br />Ship faster.
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
          Robin gives you a simple API to compress text, audio, and images. Reduce size, reduce cost, keep quality.
        </p>
        <Button
          size="lg"
          className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light px-8"
          asChild
        >
          <Link href="/sign-up">Start for free</Link>
        </Button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create Features.tsx**

```tsx
// dashboard/app/components/landing/Features.tsx
import { FileText, Music, Image } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Text compression',
    description: 'Trim, shorten, minify, or summarize. Multiple operations, one API call.',
  },
  {
    icon: Music,
    title: 'Audio compression',
    description: 'Remove silence, normalize, speed up. Optimized presets for podcasts and lectures.',
  },
  {
    icon: Image,
    title: 'Image compression',
    description: 'Smart compression that keeps your images looking sharp. Coming soon.',
  },
]

export function Features() {
  return (
    <section id="features" className="bg-background-section py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-muted text-center mb-16">One platform, three types of compression.</p>
        <div className="grid grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-background rounded-xl p-6 shadow-sm border border-border">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create HowItWorks.tsx**

```tsx
// dashboard/app/components/landing/HowItWorks.tsx
const steps = [
  { n: '01', title: 'Get an API key', description: 'Sign up and create your first API key in seconds.' },
  { n: '02', title: 'Send a URL', description: 'Pass a URL to your file. Robin fetches, processes, and returns the result.' },
  { n: '03', title: 'Download the output', description: 'Get a link to the compressed file or copy the compressed text.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-muted text-center mb-16">Three steps to smaller files.</p>
        <div className="grid grid-cols-3 gap-8">
          {steps.map(({ n, title, description }) => (
            <div key={n} className="text-center">
              <div className="text-5xl font-bold text-accent-light mb-4">{n}</div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create Pricing.tsx (mocked)**

```tsx
// dashboard/app/components/landing/Pricing.tsx
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For getting started',
    features: ['10,000 tokens/month', '1 API key', 'Text + Audio compression'],
    cta: 'Start for free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'For teams shipping fast',
    features: ['500,000 tokens/month', '5 API keys', 'Text + Audio + Image', 'Priority processing'],
    cta: 'Get Pro',
    href: '/sign-up',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large scale needs',
    features: ['Unlimited tokens', 'Unlimited API keys', 'Dedicated support', 'SLA'],
    cta: 'Contact us',
    href: '/sign-up',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-background-section py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-muted text-center mb-16">Start free, scale as you grow.</p>
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 border ${
                plan.highlight
                  ? 'bg-accent-light border-accent-strong shadow-sm'
                  : 'bg-background border-border shadow-sm'
              }`}
            >
              <div className="mb-6">
                <h3 className="font-semibold mb-1">{plan.name}</h3>
                <div className="text-3xl font-bold mb-1">{plan.price}<span className="text-base font-normal text-muted">{plan.price !== 'Custom' ? '/mo' : ''}</span></div>
                <p className="text-sm text-muted">{plan.description}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent-strong flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full rounded-full ${
                  plan.highlight
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'bg-accent-strong text-foreground hover:bg-accent-light'
                }`}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create (public)/page.tsx**

```tsx
// dashboard/app/(public)/page.tsx
import { Hero } from '@/app/components/landing/Hero'
import { Features } from '@/app/components/landing/Features'
import { HowItWorks } from '@/app/components/landing/HowItWorks'
import { Pricing } from '@/app/components/landing/Pricing'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
    </>
  )
}
```

- [ ] **Step 6: Verify in browser**

```bash
bun run dev
```

Open `http://localhost:3333`. You should see the landing page with all sections, Inter font, and the color palette applied.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/(public)/page.tsx dashboard/app/components/landing/
git commit -m "feat: add landing page (Hero, Features, HowItWorks, Pricing)"
```

---

## Task 12: Auth pages

**Files:**
- Create: `dashboard/app/(auth)/layout.tsx`
- Create: `dashboard/app/(auth)/sign-in/page.tsx`
- Create: `dashboard/app/(auth)/sign-up/page.tsx`

- [ ] **Step 1: Create (auth)/layout.tsx**

```tsx
// dashboard/app/(auth)/layout.tsx
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="font-semibold text-lg tracking-tight mb-8">
        Robin
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create sign-in page**

```tsx
// dashboard/app/(auth)/sign-in/page.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { signIn } from '@/app/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn.email({ email, password })
      router.push('/dashboard')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-8">
      <h1 className="text-xl font-semibold mb-1">Sign in</h1>
      <p className="text-sm text-muted mb-6">Welcome back.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-full bg-accent-strong text-foreground hover:bg-accent-light"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-4">
        No account?{' '}
        <Link href="/sign-up" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create sign-up page**

```tsx
// dashboard/app/(auth)/sign-up/page.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { signUp } from '@/app/lib/auth-client'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp.email({ name, email, password })
      router.push('/dashboard')
    } catch {
      toast.error('Could not create account. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-8">
      <h1 className="text-xl font-semibold mb-1">Create account</h1>
      <p className="text-sm text-muted mb-6">Start compressing in seconds.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-full bg-accent-strong text-foreground hover:bg-accent-light"
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-4">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Navigate to `http://localhost:3333/sign-in` and `http://localhost:3333/sign-up`. Both should render centered cards.

- [ ] **Step 5: Commit**

```bash
git add dashboard/app/(auth)/
git commit -m "feat: add auth pages (sign-in, sign-up)"
```

---

## Task 13: Dashboard layout (Sidebar + Topbar)

**Files:**
- Create: `dashboard/app/components/layout/NavItem.tsx`
- Create: `dashboard/app/components/layout/Sidebar.tsx`
- Create: `dashboard/app/components/layout/Topbar.tsx`
- Create: `dashboard/app/(app)/layout.tsx`

The sidebar must:
- Show icons + labels when expanded (`w-56`), icons only when collapsed (`w-14`)
- Persist expanded/collapsed state to `localStorage`
- Highlight the active nav item with `bg-accent-light`

- [ ] **Step 1: Create NavItem.tsx**

```tsx
// dashboard/app/components/layout/NavItem.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  collapsed: boolean
}

export function NavItem({ href, icon: Icon, label, collapsed }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent-light text-foreground'
          : 'text-muted hover:bg-background-section hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
```

- [ ] **Step 2: Create Sidebar.tsx**

```tsx
// dashboard/app/components/layout/Sidebar.tsx
'use client'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FileText, Music, Image, Key,
  CreditCard, User, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { NavItem } from './NavItem'
import { Separator } from '@/app/components/ui/separator'
import { cn } from '@/app/lib/utils'

const STORAGE_KEY = 'robin_sidebar_collapsed'

const toolNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/text', icon: FileText, label: 'Text' },
  { href: '/dashboard/audio', icon: Music, label: 'Audio' },
  { href: '/dashboard/image', icon: Image, label: 'Image' },
]

const settingsNav = [
  { href: '/dashboard/keys', icon: Key, label: 'API Keys' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
]

const accountNav = [
  { href: '/dashboard/account', icon: User, label: 'Account' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev))
      return !prev
    })
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-border transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('h-14 flex items-center border-b border-border px-4', collapsed && 'justify-center px-2')}>
        {collapsed ? (
          <span className="font-bold text-sm">R</span>
        ) : (
          <span className="font-semibold tracking-tight">Robin</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {toolNav.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
        <Separator className="my-2" />
        {settingsNav.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
        <Separator className="my-2" />
        {accountNav.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={toggle}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:bg-background-section hover:text-foreground transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create Topbar.tsx**

```tsx
// dashboard/app/components/layout/Topbar.tsx
'use client'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from '@/app/lib/auth-client'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { useRouter } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/text': 'Text',
  '/dashboard/audio': 'Audio',
  '/dashboard/image': 'Image',
  '/dashboard/keys': 'API Keys',
  '/dashboard/billing': 'Billing',
  '/dashboard/account': 'Account',
}

export function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()
  const title = PAGE_TITLES[pathname] ?? 'Dashboard'
  const initials = session?.user?.name?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="font-semibold text-base">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarFallback className="bg-accent-light text-foreground text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => router.push('/dashboard/account')}>
            Account
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await signOut()
              router.push('/sign-in')
            }}
            className="text-red-600"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

- [ ] **Step 4: Create (app)/layout.tsx**

```tsx
// dashboard/app/(app)/layout.tsx
import { Sidebar } from '@/app/components/layout/Sidebar'
import { Topbar } from '@/app/components/layout/Topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create placeholder page to verify layout**

Create `dashboard/app/(app)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return <div className="text-muted">Dashboard coming soon</div>
}
```

- [ ] **Step 6: Verify layout in browser**

Sign in (or temporarily remove the middleware check for local dev), navigate to `/dashboard`. You should see the sidebar + topbar layout.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/(app)/ dashboard/app/components/layout/
git commit -m "feat: add dashboard shell layout (collapsible sidebar + topbar)"
```

---

## Task 14: Dashboard overview page

**Files:**
- Create: `dashboard/app/components/dashboard/StatCard.tsx`
- Create: `dashboard/app/components/dashboard/UsageChart.tsx`
- Create: `dashboard/app/components/dashboard/RecentJobsTable.tsx`
- Create: `dashboard/app/components/dashboard/QuickActions.tsx`
- Modify: `dashboard/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create StatCard.tsx**

```tsx
// dashboard/app/components/dashboard/StatCard.tsx
import { cn } from '@/app/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  description?: string
  className?: string
}

export function StatCard({ label, value, description, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-xl p-5 border border-border shadow-sm', className)}>
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {description && <p className="text-xs text-muted mt-1">{description}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create UsageChart.tsx**

```tsx
// dashboard/app/components/dashboard/UsageChart.tsx
'use client'
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { UsageChartPoint } from '@/types'

interface UsageChartProps {
  data: UsageChartPoint[]
}

export function UsageChart({ data }: UsageChartProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
      <p className="text-sm font-medium mb-4">Requests (last 30 days)</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="requests"
            stroke="#A0C878"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create RecentJobsTable.tsx**

```tsx
// dashboard/app/components/dashboard/RecentJobsTable.tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/app/components/ui/table'
import { Badge } from '@/app/components/ui/badge'
import type { RecentActivity } from '@/types'

interface RecentJobsTableProps {
  jobs: RecentActivity[]
}

const statusVariant = (status: string) =>
  status === 'success' ? 'bg-accent-light text-foreground' : 'bg-red-100 text-red-700'

export function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
        <p className="text-muted text-sm">No jobs yet.</p>
        <p className="text-muted text-xs mt-1">
          Try processing some{' '}
          <a href="/dashboard/text" className="underline text-foreground">text</a> or{' '}
          <a href="/dashboard/audio" className="underline text-foreground">audio</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Latency</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.type}</TableCell>
              <TableCell>
                <Badge className={`text-xs border-0 rounded-full ${statusVariant(job.status)}`}>
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted text-sm">{job.size}</TableCell>
              <TableCell className="text-muted text-sm">{job.latency}</TableCell>
              <TableCell className="text-muted text-sm">{job.timestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 4: Create QuickActions.tsx**

```tsx
// dashboard/app/components/dashboard/QuickActions.tsx
import Link from 'next/link'
import { FileText, Music, Image } from 'lucide-react'

const actions = [
  { href: '/dashboard/text', icon: FileText, label: 'Compress Text', description: 'Trim, shorten, or summarize' },
  { href: '/dashboard/audio', icon: Music, label: 'Compress Audio', description: 'Remove silence, normalize' },
  { href: '/dashboard/image', icon: Image, label: 'Compress Image', description: 'Coming soon', disabled: true },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {actions.map(({ href, icon: Icon, label, description, disabled }) => (
        <Link
          key={href}
          href={disabled ? '#' : href}
          className={`bg-white rounded-xl p-5 border border-border shadow-sm flex items-center gap-4 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-strong'
          }`}
          onClick={disabled ? (e) => e.preventDefault() : undefined}
        >
          <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Implement dashboard overview page**

```tsx
// dashboard/app/(app)/dashboard/page.tsx
'use client'
import useSWR from 'swr'
import { StatCard } from '@/app/components/dashboard/StatCard'
import { UsageChart } from '@/app/components/dashboard/UsageChart'
import { RecentJobsTable } from '@/app/components/dashboard/RecentJobsTable'
import { QuickActions } from '@/app/components/dashboard/QuickActions'
import { Skeleton } from '@/app/components/ui/skeleton'
import { getUsageAnalytics } from '@/app/http/usage'
import type { ApiResponse, UsageAnalytics } from '@/types'

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR<ApiResponse<UsageAnalytics>>(
    'usage-analytics',
    () => getUsageAnalytics('30d')
  )

  const analytics = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        Failed to load dashboard data.
        <button onClick={() => window.location.reload()} className="ml-2 underline text-foreground">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Requests" value={analytics?.stats.totalRequests ?? 0} />
        <StatCard label="Tokens Saved" value={analytics?.stats.tokensSaved ?? 0} description="bytes saved across all jobs" />
        <StatCard label="Tokens Used" value={analytics?.stats.tokensUsed ?? 0} />
      </div>

      {analytics?.chart && <UsageChart data={analytics.chart} />}

      <div>
        <h2 className="font-medium text-sm mb-3">Quick actions</h2>
        <QuickActions />
      </div>

      <div>
        <h2 className="font-medium text-sm mb-3">Recent activity</h2>
        <RecentJobsTable jobs={analytics?.recent ?? []} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add dashboard/app/components/dashboard/ dashboard/app/(app)/dashboard/page.tsx
git commit -m "feat: add dashboard overview page with stats, chart, and recent jobs"
```

---

## Task 15: Shared tool components

These components are shared by the Text, Audio, and Image tool pages.

**Files:**
- Create: `dashboard/app/components/tools/ToolLayout.tsx`
- Create: `dashboard/app/components/tools/UrlInput.tsx`
- Create: `dashboard/app/components/tools/MetricsPanel.tsx`
- Create: `dashboard/app/components/tools/PresetSelector.tsx`

- [ ] **Step 1: Create ToolLayout.tsx**

```tsx
// dashboard/app/components/tools/ToolLayout.tsx
interface ToolLayoutProps {
  title: string
  description: string
  inputPanel: React.ReactNode
  outputPanel: React.ReactNode
  action: React.ReactNode
}

export function ToolLayout({ title, description, inputPanel, outputPanel, action }: ToolLayoutProps) {
  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">{inputPanel}</div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">{outputPanel}</div>
      </div>
      <div className="flex justify-end">{action}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create UrlInput.tsx**

```tsx
// dashboard/app/components/tools/UrlInput.tsx
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'

interface UrlInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function UrlInput({
  value,
  onChange,
  placeholder = 'https://example.com/file',
  label = 'File URL',
}: UrlInputProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="url"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-muted">Paste a public URL to your file.</p>
    </div>
  )
}
```

- [ ] **Step 3: Create MetricsPanel.tsx**

```tsx
// dashboard/app/components/tools/MetricsPanel.tsx
import { Skeleton } from '@/app/components/ui/skeleton'
import { formatBytes } from '@/app/lib/utils'
import type { JobMetrics, JobStatus } from '@/types'

interface MetricsPanelProps {
  status: JobStatus | undefined
  metrics: JobMetrics | undefined
  error: string | undefined
  timedOut: boolean
}

export function MetricsPanel({ status, metrics, error, timedOut }: MetricsPanelProps) {
  if (!status) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted">
        Output will appear here
      </div>
    )
  }

  if (status === 'created' || status === 'pending' || status === 'processing') {
    if (timedOut) {
      return (
        <div className="text-sm text-muted text-center">
          This is taking longer than expected.{' '}
          <button onClick={() => window.location.reload()} className="underline text-foreground">
            Try again
          </button>
        </div>
      )
    }
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
        <p className="text-xs text-muted mt-2">Processing…</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="text-sm text-red-600">
        Job failed: {error ?? 'Unknown error'}
      </div>
    )
  }

  if (status === 'completed' && metrics) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{metrics.compressionRatio}×</span>
          <span className="text-sm text-muted">smaller</span>
        </div>
        <div className="text-sm text-muted">
          {formatBytes(metrics.inputSize)} → {formatBytes(metrics.outputSize)}
        </div>
        <div className="text-xs text-muted">
          Operations: {metrics.operationsApplied.join(' → ')}
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 4: Create PresetSelector.tsx**

```tsx
// dashboard/app/components/tools/PresetSelector.tsx
import { Label } from '@/app/components/ui/label'
import { cn } from '@/app/lib/utils'

interface Preset {
  value: string
  label: string
  description: string
}

interface PresetSelectorProps<T extends string> {
  presets: Preset[]
  value: T
  onChange: (value: T) => void
}

export function PresetSelector<T extends string>({
  presets,
  value,
  onChange,
}: PresetSelectorProps<T>) {
  return (
    <div className="space-y-1.5 mt-4">
      <Label>Preset</Label>
      <div className="grid gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value as T)}
            className={cn(
              'text-left px-3 py-2 rounded-xl border text-sm transition-colors',
              value === preset.value
                ? 'border-accent-strong bg-accent-light'
                : 'border-border hover:border-accent-light'
            )}
          >
            <span className="font-medium">{preset.label}</span>
            <span className="text-muted ml-2">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add dashboard/app/components/tools/
git commit -m "feat: add shared tool components (ToolLayout, UrlInput, MetricsPanel, PresetSelector)"
```

---

## Task 16: Text tool page

**Files:**
- Modify: `dashboard/app/(app)/dashboard/text/page.tsx`

- [ ] **Step 1: Create text/page.tsx**

```tsx
// dashboard/app/(app)/dashboard/text/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/button'
import { ToolLayout } from '@/app/components/tools/ToolLayout'
import { UrlInput } from '@/app/components/tools/UrlInput'
import { PresetSelector } from '@/app/components/tools/PresetSelector'
import { MetricsPanel } from '@/app/components/tools/MetricsPanel'
import { useJobPoll } from '@/app/hooks/use-job-poll'
import { submitTextJob } from '@/app/http/text'
import { getTextJobStatus } from '@/app/http/jobs'
import type { TextPreset } from '@/types'

const TEXT_PRESETS = [
  { value: 'chill', label: 'Chill', description: 'Light cleanup, just trim whitespace' },
  { value: 'medium', label: 'Medium', description: 'Trim + Shorten for balanced compression' },
  { value: 'aggressive', label: 'Aggressive', description: 'Shorten + Minify for maximum compression' },
]

export default function TextPage() {
  const [url, setUrl] = useState('')
  const [preset, setPreset] = useState<TextPreset>('medium')
  const [jobId, setJobId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { job, isPolling, isCompleted, isFailed, timedOut, error } = useJobPoll({
    jobId,
    fetcher: getTextJobStatus,
  })

  async function handleSubmit() {
    if (!url) return toast.error('Please enter a URL')
    setJobId(null)
    setSubmitting(true)
    try {
      const res = await submitTextJob({ textUrl: url, preset })
      setJobId(res.data._id)
    } catch {
      toast.error('Failed to submit job. Check your API key and URL.')
    } finally {
      setSubmitting(false)
    }
  }

  // Show error toast once when job transitions to failed (not on every render)
  useEffect(() => {
    if (isFailed) toast.error(job?.error ?? 'Job failed')
  }, [isFailed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ToolLayout
      title="Text compression"
      description="Compress a text file using a preset. Paste a public URL to your file."
      inputPanel={
        <>
          <UrlInput
            value={url}
            onChange={setUrl}
            placeholder="https://example.com/my-text.txt"
            label="Text file URL"
          />
          <PresetSelector presets={TEXT_PRESETS} value={preset} onChange={setPreset} />
        </>
      }
      outputPanel={
        <MetricsPanel
          status={job?.status}
          metrics={job?.result?.metrics}
          error={job?.error}
          timedOut={timedOut}
        />
      }
      action={
        <Button
          onClick={handleSubmit}
          disabled={submitting || isPolling}
          className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light"
        >
          {submitting || isPolling ? 'Processing…' : 'Compress'}
        </Button>
      }
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/app/(app)/dashboard/text/
git commit -m "feat: add text tool page"
```

---

## Task 17: Audio tool page

**Files:**
- Modify: `dashboard/app/(app)/dashboard/audio/page.tsx`

- [ ] **Step 1: Create audio/page.tsx**

```tsx
// dashboard/app/(app)/dashboard/audio/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/button'
import { ToolLayout } from '@/app/components/tools/ToolLayout'
import { UrlInput } from '@/app/components/tools/UrlInput'
import { PresetSelector } from '@/app/components/tools/PresetSelector'
import { MetricsPanel } from '@/app/components/tools/MetricsPanel'
import { useJobPoll } from '@/app/hooks/use-job-poll'
import { submitAudioJob } from '@/app/http/audio'
import { getAudioJobStatus } from '@/app/http/jobs'
import type { AudioPreset } from '@/types'

const AUDIO_PRESETS = [
  { value: 'chill', label: 'Chill', description: 'Light processing, preserves original dynamics' },
  { value: 'medium', label: 'Medium', description: 'Balanced processing for general use' },
  { value: 'aggressive', label: 'Aggressive', description: 'Heavy processing, maximizes loudness' },
  { value: 'podcast', label: 'Podcast', description: 'Optimized for voice content' },
  { value: 'lecture', label: 'Lecture', description: 'Trim silence + 1.5× speed + normalize' },
]

export default function AudioPage() {
  const [url, setUrl] = useState('')
  const [preset, setPreset] = useState<AudioPreset>('medium')
  const [jobId, setJobId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { job, isPolling, isFailed, timedOut } = useJobPoll({
    jobId,
    fetcher: getAudioJobStatus,
  })

  async function handleSubmit() {
    if (!url) return toast.error('Please enter a URL')
    setJobId(null)
    setSubmitting(true)
    try {
      const res = await submitAudioJob({ audioUrl: url, preset })
      setJobId(res.data._id)
    } catch {
      toast.error('Failed to submit job. Check your API key and URL.')
    } finally {
      setSubmitting(false)
    }
  }

  // Show error toast once when job transitions to failed (not on every render)
  useEffect(() => {
    if (isFailed) toast.error(job?.error ?? 'Job failed')
  }, [isFailed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ToolLayout
      title="Audio compression"
      description="Process an audio file using a preset. Paste a public URL to your audio file."
      inputPanel={
        <>
          <UrlInput
            value={url}
            onChange={setUrl}
            placeholder="https://example.com/recording.mp3"
            label="Audio file URL"
          />
          <PresetSelector presets={AUDIO_PRESETS} value={preset} onChange={setPreset} />
        </>
      }
      outputPanel={
        <MetricsPanel
          status={job?.status}
          metrics={job?.result?.metrics}
          error={job?.error}
          timedOut={timedOut}
        />
      }
      action={
        <Button
          onClick={handleSubmit}
          disabled={submitting || isPolling}
          className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light"
        >
          {submitting || isPolling ? 'Processing…' : 'Process audio'}
        </Button>
      }
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/app/(app)/dashboard/audio/
git commit -m "feat: add audio tool page"
```

---

## Task 18: Image tool page (mocked)

**Files:**
- Create: `dashboard/app/(app)/dashboard/image/page.tsx`

- [ ] **Step 1: Create image/page.tsx**

```tsx
// dashboard/app/(app)/dashboard/image/page.tsx
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Image } from 'lucide-react'

const IMAGE_PRESETS = [
  { value: 'light', label: 'Light', description: 'Minimal compression, best quality' },
  { value: 'balanced', label: 'Balanced', description: 'Good compression, good quality' },
  { value: 'aggressive', label: 'Aggressive', description: 'Maximum compression' },
]

export default function ImagePage() {
  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Image compression</h2>
          <p className="text-sm text-muted mt-0.5">
            Smart image compression that keeps quality high.
          </p>
        </div>
        <Badge className="bg-accent-light text-foreground border-0 rounded-full">Coming soon</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 opacity-60 pointer-events-none select-none">
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <div className="space-y-1.5">
            <Label>Image file URL</Label>
            <Input type="url" placeholder="https://example.com/photo.jpg" disabled />
            <p className="text-xs text-muted">Paste a public URL to your image file.</p>
          </div>
          <div className="space-y-1.5 mt-4">
            <Label>Preset</Label>
            <div className="grid gap-2">
              {IMAGE_PRESETS.map((preset) => (
                <div
                  key={preset.value}
                  className="text-left px-3 py-2 rounded-xl border border-border text-sm"
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-muted ml-2">{preset.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm p-5 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-background-section flex items-center justify-center">
            <Image className="w-7 h-7 text-muted" />
          </div>
          <p className="text-sm text-muted">Image preview will appear here</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          disabled
          className="rounded-full bg-accent-strong text-foreground opacity-50 cursor-not-allowed"
        >
          Compress image
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/app/(app)/dashboard/image/
git commit -m "feat: add image tool page (mocked coming-soon UI)"
```

---

## Task 19: API Keys page

**Files:**
- Create: `dashboard/app/(app)/dashboard/keys/page.tsx`

- [ ] **Step 1: Create keys/page.tsx**

```tsx
// dashboard/app/(app)/dashboard/keys/page.tsx
'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Badge } from '@/app/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/app/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { getApiKeys, createApiKey, revokeApiKey } from '@/app/http/keys'
import { maskKey } from '@/app/lib/utils'
import type { ApiResponse, ApiKey } from '@/types'

export default function KeysPage() {
  const { data, isLoading, mutate } = useSWR<ApiResponse<ApiKey[]>>('api-keys', getApiKeys)
  const keys = data?.data ?? []

  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)

  async function handleCreate() {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await createApiKey(newKeyName.trim())
      setNewKeyValue(res.data.key)
      setNewKeyName('')
      mutate()
    } catch {
      toast.error('Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revokeApiKey(id)
      toast.success('Key revoked')
      mutate()
    } catch {
      toast.error('Failed to revoke key')
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted mt-0.5">Manage your API keys. Maximum 5 active keys.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light">
              <Plus className="w-4 h-4 mr-1" /> New key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKeyValue ? (
              <>
                <DialogHeader>
                  <DialogTitle>Key created</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted mb-3">
                  Copy this key now. It won&apos;t be shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background-section rounded-xl px-3 py-2 text-sm font-mono break-all">
                    {newKeyValue}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(newKeyValue)
                      toast.success('Copied!')
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  className="mt-4 w-full rounded-full bg-accent-strong text-foreground"
                  onClick={() => { setDialogOpen(false); setNewKeyValue(null) }}
                >
                  Done
                </Button>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5 mt-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g. Production"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <Button
                  className="mt-4 w-full rounded-full bg-accent-strong text-foreground hover:bg-accent-light"
                  onClick={handleCreate}
                  disabled={creating || !newKeyName.trim()}
                >
                  {creating ? 'Creating…' : 'Create key'}
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
          <p className="text-muted text-sm">No API keys yet.</p>
          <button
            className="text-sm underline text-foreground mt-1"
            onClick={() => setDialogOpen(true)}
          >
            Create your first key
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key._id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="text-sm font-mono text-muted">{maskKey(key.key)}</code>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs border-0 rounded-full ${
                      key.status === 'active'
                        ? 'bg-accent-light text-foreground'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted text-sm">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted text-sm">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    {key.status === 'active' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Any apps using "{key.name}" will stop working immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevoke(key._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/app/(app)/dashboard/keys/
git commit -m "feat: add API Keys page (create, list, revoke)"
```

---

## Task 20: Billing and Account pages

**Files:**
- Create: `dashboard/app/(app)/dashboard/billing/page.tsx`
- Create: `dashboard/app/(app)/dashboard/account/page.tsx`

- [ ] **Step 1: Create billing/page.tsx (mocked)**

```tsx
// dashboard/app/(app)/dashboard/billing/page.tsx
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'

export default function BillingPage() {
  const MOCK_USED = 4200
  const MOCK_LIMIT = 10000
  const pct = Math.round((MOCK_USED / MOCK_LIMIT) * 100)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted mt-0.5">Your current plan and usage.</p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold">Free plan</p>
            <p className="text-sm text-muted">$0 / month</p>
          </div>
          <Badge className="bg-accent-light text-foreground border-0 rounded-full">Current plan</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Token usage</span>
            <span className="font-medium">{MOCK_USED.toLocaleString()} / {MOCK_LIMIT.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-background-section overflow-hidden">
            <div
              className="h-full bg-accent-strong rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted">{pct}% of monthly limit used</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h3 className="font-medium mb-1">Upgrade to Pro</h3>
        <p className="text-sm text-muted mb-4">500,000 tokens/month, 5 API keys, priority processing. $19/mo.</p>
        <Button disabled className="rounded-full bg-accent-strong text-foreground opacity-50 cursor-not-allowed">
          Upgrade — coming soon
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create account/page.tsx**

```tsx
// dashboard/app/(app)/dashboard/account/page.tsx
'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Separator } from '@/app/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { useSession, authClient } from '@/app/lib/auth-client'

export default function AccountPage() {
  const { data: session } = useSession()
  const user = session?.user

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPw(true)
    try {
      await authClient.changePassword({ newPassword, revokeOtherSessions: false })
      toast.success('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Failed to change password')
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      {/* Profile */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h2 className="font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={user?.name ?? ''} disabled className="bg-background-section" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-background-section" />
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h2 className="font-semibold mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              placeholder="Min. 8 characters"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Confirm password</Label>
            <Input
              id="confirm-pw"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={changingPw}
            className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light"
          >
            {changingPw ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
        <h2 className="font-semibold mb-1 text-red-600">Danger zone</h2>
        <p className="text-sm text-muted mb-4">Permanently delete your account and all data.</p>
        <Separator className="mb-4" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is not yet available. Contact support to delete your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled className="opacity-50">
                Delete — coming soon
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/app/(app)/dashboard/billing/ dashboard/app/(app)/dashboard/account/
git commit -m "feat: add billing (mocked) and account pages"
```

---

## Task 21: API key banner and final wiring

**Files:**
- Create: `dashboard/app/components/layout/ApiKeyBanner.tsx`
- Modify: `dashboard/app/(app)/layout.tsx`

If the user has no API key in localStorage, show a dismissible banner at the top of all dashboard pages.

- [ ] **Step 1: Create ApiKeyBanner.tsx**

```tsx
// dashboard/app/components/layout/ApiKeyBanner.tsx
'use client'
import Link from 'next/link'
import { useApiKey } from '@/app/hooks/use-api-key'
import { usePathname } from 'next/navigation'

export function ApiKeyBanner() {
  const { hasKey } = useApiKey()
  const pathname = usePathname()

  if (hasKey || pathname === '/dashboard/keys') return null

  return (
    <div className="bg-accent-light border-b border-accent-strong px-6 py-2 text-sm text-foreground flex items-center gap-2">
      <span>You need an API key to use Robin tools.</span>
      <Link href="/dashboard/keys" className="font-medium underline underline-offset-4">
        Create one →
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Add banner to (app)/layout.tsx**

```tsx
// dashboard/app/(app)/layout.tsx
import { Sidebar } from '@/app/components/layout/Sidebar'
import { Topbar } from '@/app/components/layout/Topbar'
import { ApiKeyBanner } from '@/app/components/layout/ApiKeyBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <ApiKeyBanner />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
cd dashboard && bun run test:run
```

Expected: All tests PASS.

- [ ] **Step 4: Run type check**

```bash
cd dashboard && bunx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Final commit**

```bash
git add dashboard/app/components/layout/ApiKeyBanner.tsx dashboard/app/(app)/layout.tsx
git commit -m "feat: add API key banner to dashboard layout"
```

---

## Done ✓

All pages implemented:
- `/` — Landing page
- `/sign-in`, `/sign-up` — Auth
- `/dashboard` — Overview (stats, chart, recent jobs, quick actions)
- `/dashboard/text` — Text compression tool
- `/dashboard/audio` — Audio compression tool
- `/dashboard/image` — Image (mocked, coming soon)
- `/dashboard/keys` — API key management
- `/dashboard/billing` — Billing (mocked)
- `/dashboard/account` — Account settings + change password
