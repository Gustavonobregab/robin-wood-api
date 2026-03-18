'use client'
import { SWRConfig } from 'swr'
import { Toaster } from '@/app/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        errorRetryCount: 2,
      }}
    >
      {children}
      <Toaster richColors position="top-right" />
    </SWRConfig>
  )
}
