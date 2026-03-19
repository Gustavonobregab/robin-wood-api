'use client'
import { type ReactNode } from 'react'

interface ToolLayoutProps {
  title: string
  description: string
  inputPanel: ReactNode
  outputPanel: ReactNode
  settingsPanel?: ReactNode
  historyPanel?: ReactNode
  action: ReactNode
  credits?: number
}

export function ToolLayout({ title, description, inputPanel, outputPanel, settingsPanel, historyPanel, action, credits }: ToolLayoutProps) {
  const hasTabs = !!historyPanel

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col justify-between p-10 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl space-y-4">
            <div className="bg-background rounded-xl border border-border shadow-sm p-6">
              {inputPanel}
            </div>
            <div className="bg-background rounded-xl border border-border shadow-sm p-6">
              {outputPanel}
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto flex items-center justify-between pt-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              {credits != null
                ? `${credits.toLocaleString()} credits remaining`
                : 'x credits remaining'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {action}
          </div>
        </div>
      </div>

      <div className="w-[480px] border-l border-border bg-background overflow-y-auto shrink-0">
        {hasTabs ? (
          <>
            <div className="flex gap-6 px-8 pt-6 border-b border-border">
              <div className="pb-3 text-sm font-medium border-b-2 -mb-px border-foreground text-foreground">
                Settings
              </div>
              <span
                className="pb-3 text-sm font-medium border-b-2 -mb-px border-transparent text-muted/50 cursor-not-allowed inline-flex items-center gap-2"
                aria-disabled
              >
                History
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-background-section text-muted px-1.5 py-0.5 rounded-md">
                  Soon
                </span>
              </span>
            </div>

            <div className="p-8">
              <div className="mb-5">
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted mt-0.5">{description}</p>
              </div>
              {settingsPanel}
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
