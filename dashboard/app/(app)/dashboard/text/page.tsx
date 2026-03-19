'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/button'
import { ToolLayout } from '@/app/components/tools/ToolLayout'
import { UrlInput } from '@/app/components/tools/UrlInput'
import { MetricsPanel } from '@/app/components/tools/MetricsPanel'
import { TextSettingsPanel, type TextSettings } from '@/app/components/tools/TextSettingsPanel'
import { useJobPoll } from '@/app/hooks/use-job-poll'
import { submitTextJob } from '@/app/http/text'
import { getTextJobStatus } from '@/app/http/jobs'

export default function TextPage() {
  const [url, setUrl] = useState('')
  const [settings, setSettings] = useState<TextSettings>({ mode: 'custom', operations: [] })
  const [jobId, setJobId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { job, isPolling, isFailed, timedOut } = useJobPoll({
    jobId,
    fetcher: getTextJobStatus,
  })

  const canSubmit =
    settings.mode === 'preset' ||
    (settings.mode === 'custom' && settings.operations.length > 0)

  async function handleSubmit() {
    if (!url) return toast.error('Please enter a URL')
    if (!canSubmit) return toast.error('Enable at least one operation')
    setJobId(null)
    setSubmitting(true)
    try {
      const input =
        settings.mode === 'preset'
          ? { textUrl: url, preset: settings.preset }
          : { textUrl: url, operations: settings.operations }
          
      const res = await submitTextJob(input)
      setJobId(res.data.id)
    } catch {
      toast.error('Failed to submit job. Check your API key and URL.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (isFailed) toast.error(job?.error ?? 'Job failed')
  }, [isFailed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ToolLayout
      title="Text compression"
      description="Compress a text file using a preset or custom operations."
      inputPanel={
        <UrlInput
          value={url}
          onChange={setUrl}
          placeholder="https://example.com/my-text.txt"
          label="Text file URL"
        />
      }
      settingsPanel={<TextSettingsPanel value={settings} onChange={setSettings} />}
      historyPanel={
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-4">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="font-medium text-foreground">Your compressed text will appear here</p>
          <p className="text-sm text-muted mt-1">Submit a job to see your history</p>
        </div>
      }
      outputPanel={
        <MetricsPanel
          status={job?.status}
          metrics={job?.result?.metrics}
          outputUrl={job?.result?.outputUrl}
          error={job?.error}
          timedOut={timedOut}
        />
      }
      action={
        <Button
          onClick={handleSubmit}
          disabled={submitting || isPolling || !canSubmit}
          className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light"
        >
          {submitting || isPolling ? 'Processing…' : 'Compress'}
        </Button>
      }
    />
  )
}
