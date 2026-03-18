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
