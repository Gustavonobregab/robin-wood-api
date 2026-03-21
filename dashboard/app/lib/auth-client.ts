// dashboard/app/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

const baseURL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_API_URL

if (!baseURL) throw new Error('NEXT_PUBLIC_API_URL is not set')

export const authClient = createAuthClient({ baseURL })

export const { signIn, signUp, signOut, useSession } = authClient
