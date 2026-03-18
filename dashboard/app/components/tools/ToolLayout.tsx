'use client'
import { useState, type ReactNode } from 'react'
import { cn } from '@/app/lib/utils'

interface ToolLayoutProps {
  title: string
  description: string
  inputPanel: ReactNode
  outputPanel: ReactNode
  settingsPanel?: ReactNode
  historyPanel?: ReactNode
  action: ReactNode
}

export function ToolLayout({ title, description, inputPanel, outputPanel, settingsPanel, historyPanel, action }: ToolLayoutProps) {
  const [tab, setTab] = useState<'settings' | 'history'>('settings')
  const hasTabs = !!historyPanel

  return (
    <div className="flex h-full">
      {/* Center area */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto">
        <div className="w-full max-w-xl space-y-4">
          <div className="bg-background rounded-xl border border-border shadow-sm p-5">
            {inputPanel}
          </div>
          <div className="bg-background rounded-xl border border-border shadow-sm p-5">
            {outputPanel}
          </div>
          <div className="flex justify-end">
            {action}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-[480px] border-l border-border bg-background overflow-y-auto shrink-0">
        {hasTabs ? (
          <>
            {/* Tab bar */}
            <div className="flex gap-6 px-8 pt-6 border-b border-border">
              <button
                type="button"
                onClick={() => setTab('settings')}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                  tab === 'settings'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => setTab('history')}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                  tab === 'history'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                History
              </button>
            </div>

            {/* Tab content */}
            <div className="p-8">
              {tab === 'settings' && (
                <>
                  <div className="mb-5">
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-muted mt-0.5">{description}</p>
                  </div>
                  {settingsPanel}
                </>
              )}
              {tab === 'history' && historyPanel}
            </div>
          </>
        ) : (
          <div className="p-8">
            <div className="mb-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="text-sm text-muted mt-0.5">{description}</p>
            </div>
            {settingsPanel}
          </div>
        )}
      </div>
    </div>
  )
}
