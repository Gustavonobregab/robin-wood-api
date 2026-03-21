'use client'
import { Plus, Clock, Mic } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { soonBadgeClassName } from '@/app/components/layout/soon-badge'

export function ChatPanel() {
  return (
    <div className="w-80 shrink-0 flex flex-col h-full bg-foreground/8">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">New chat</span>
          <span className={soonBadgeClassName}>Soon</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled
            aria-disabled
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted/40 cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled
            aria-disabled
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted/40 cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        <p className="text-sm text-foreground leading-relaxed">
          Hi! How can I help you today?
        </p>
      </div>

      {/* Input: disabled until chat launches */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            disabled
            placeholder="Chat coming soon..."
            className={cn(
              'w-full bg-background-section rounded-xl px-4 py-3 text-sm outline-none border border-border pr-12 transition-colors',
              'opacity-60 cursor-not-allowed placeholder:text-muted'
            )}
          />
          <button
            type="button"
            disabled
            aria-label="Send (coming soon)"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-accent-light/50 cursor-not-allowed opacity-60"
          >
            <Mic className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
