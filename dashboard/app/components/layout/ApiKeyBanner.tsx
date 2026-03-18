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
