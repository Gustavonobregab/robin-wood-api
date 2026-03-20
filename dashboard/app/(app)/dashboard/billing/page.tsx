'use client'
import useSWR from 'swr'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Skeleton } from '@/app/components/ui/skeleton'
import { getCurrentUsage } from '@/app/http/usage'
import type { ApiResponse, CurrentUsage } from '@/types'

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function UsageRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export default function BillingPage() {
  const { data, isLoading } = useSWR<ApiResponse<CurrentUsage>>(
    'current-usage',
    getCurrentUsage,
  )

  const usage = data?.data

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-5 max-w-2xl mx-auto">
        <div>
          <h2 className="text-lg font-semibold">Billing</h2>
          <p className="text-sm text-muted mt-0.5">Your current plan and usage.</p>
        </div>

        <div className="bg-background rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">Free plan</p>
              <p className="text-sm text-muted">$0 / month</p>
            </div>
            <Badge className="bg-accent-light text-foreground border-0 rounded-full">Current plan</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-4">
              {(usage?.audio.requests ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted uppercase tracking-wide">Audio</p>
                  <UsageRow label="Requests" value={usage!.audio.requests} />
                  <UsageRow label="Duration" value={`${usage!.audio.minutes.toFixed(1)} min`} />
                  <UsageRow label="Data" value={formatBytes(usage!.audio.inputBytes)} />
                </div>
              )}

              {(usage?.text.requests ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted uppercase tracking-wide">Text</p>
                  <UsageRow label="Requests" value={usage!.text.requests} />
                  <UsageRow label="Characters" value={usage!.text.characters.toLocaleString()} />
                  <UsageRow label="Data" value={formatBytes(usage!.text.inputBytes)} />
                </div>
              )}

              {(usage?.audio.requests ?? 0) === 0 && (usage?.text.requests ?? 0) === 0 && (
                <p className="text-sm text-muted">No usage this month.</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-background rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-medium mb-1">Upgrade to Pro</h3>
          <p className="text-sm text-muted mb-4">Priority processing and higher limits. $19/mo.</p>
          <Button disabled className="rounded-full bg-accent-strong text-foreground opacity-50 cursor-not-allowed">
            Upgrade — coming soon
          </Button>
        </div>
      </div>
    </div>
  )
}
