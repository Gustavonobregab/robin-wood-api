'use client'
import useSWR from 'swr'
import { cn } from '@/app/lib/utils'
import { Label } from '@/app/components/ui/label'
import { getTextPresets, getTextOperations } from '@/app/http/text'
import type { TextPreset, TextOperationInput } from '@/types'

export type TextSettings =
  | { mode: 'preset'; preset: TextPreset }
  | { mode: 'custom'; operations: TextOperationInput[] }

interface TextSettingsPanelProps {
  value: TextSettings
  onChange: (value: TextSettings) => void
}

const LANG_OPTIONS = ['EN', 'PT'] as const
const ALGO_OPTIONS = ['gzip', 'brotli'] as const

//TODO: VERIFY IF/ELSES 
export function TextSettingsPanel({ value, onChange }: TextSettingsPanelProps) {
  const { data: presetsData, error: presetsError, isLoading: presetsLoading } = useSWR('text/presets', () => getTextPresets())
  const { data: operationsData, error: operationsError, isLoading: operationsLoading } = useSWR('text/operations', () => getTextOperations())

  console.log('[TextSettingsPanel] presets ->', { data: presetsData, error: presetsError, loading: presetsLoading })
  console.log('[TextSettingsPanel] operations ->', { data: operationsData, error: operationsError, loading: operationsLoading })

  const presets = presetsData?.data ?? []
  const operations = operationsData?.data ?? []

  const customOps: TextOperationInput[] =
    value.mode === 'custom' ? value.operations : []

  function switchToPreset() {
    onChange({ mode: 'preset', preset: 'medium' })
  }

  function switchToCustom() {
    onChange({ mode: 'custom', operations: [] })
  }

  function toggleOperation(opId: string) {
    if (value.mode !== 'custom') return
    const exists = value.operations.find((o) => o.type === opId)
    if (exists) {
      onChange({ mode: 'custom', operations: value.operations.filter((o) => o.type !== opId) })
    } else {
      const opDef = operations.find((o) => o.id === opId)
      const defaultParams: Record<string, number | string> = {}
      if (opDef) {
        for (const [key, param] of Object.entries(opDef.params)) {
          defaultParams[key] = param.default
        }
      }
      onChange({ mode: 'custom', operations: [...value.operations, { type: opId, params: defaultParams }] })
    }
  }

  function setParam(opId: string, paramKey: string, paramValue: number | string) {
    if (value.mode !== 'custom') return
    onChange({
      mode: 'custom',
      operations: value.operations.map((o) =>
        o.type === opId ? { ...o, params: { ...o.params, [paramKey]: paramValue } } : o
      ),
    })
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-background-section rounded-xl p-1">
        <button
          type="button"
          onClick={switchToPreset}
          className={cn(
            'flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors',
            value.mode === 'preset'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
        >
          Preset
        </button>
        <button
          type="button"
          onClick={switchToCustom}
          className={cn(
            'flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors',
            value.mode === 'custom'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
        >
          Custom
        </button>
      </div>

      {/* Preset mode */}
      {value.mode === 'preset' && (
        <div className="grid gap-2">
          {presets.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-background-section animate-pulse" />
              ))
            : presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange({ mode: 'preset', preset: preset.id as TextPreset })}
                  className={cn(
                    'text-left px-3 py-2 rounded-xl border text-sm transition-colors',
                    value.preset === preset.id
                      ? 'border-accent-strong bg-accent-light'
                      : 'border-border hover:border-accent-light'
                  )}
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-muted ml-2">{preset.description}</span>
                </button>
              ))}
        </div>
      )}

      {/* Custom mode */}
      {value.mode === 'custom' && (
        <div className="space-y-3">
          {operations.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-background-section animate-pulse" />
              ))
            : operations.map((op) => {
                const active = customOps.find((o) => o.type === op.id)
                const params = active?.params ?? {}

                return (
                  <div key={op.id} className="space-y-2">
                    {/* Operation header with toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">{op.name}</Label>
                        <p className="text-xs text-muted mt-0.5">{op.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleOperation(op.id)}
                        className={cn(
                          'relative w-10 h-6 rounded-full transition-colors shrink-0',
                          active ? 'bg-foreground' : 'bg-background-section'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                            active ? 'left-5' : 'left-1'
                          )}
                        />
                      </button>
                    </div>

                    {/* Params — only shown when enabled */}
                    {active && (
                      <div className="pl-0 space-y-2">
                        {Object.entries(op.params).map(([key, param]) => {
                          if (param.type === 'number') {
                            const val = (params[key] as number) ?? (param.default as number)
                            return (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-xs text-muted">
                                  <span className="capitalize">{key}</span>
                                  <span>{val}</span>
                                </div>
                                <input
                                  type="range"
                                  min={param.min ?? 0}
                                  max={param.max ?? 100}
                                  value={val}
                                  onChange={(e) => setParam(op.id, key, Number(e.target.value))}
                                  className="w-full h-1.5 appearance-none rounded-full bg-background-section accent-foreground cursor-pointer"
                                />
                              </div>
                            )
                          }

                          if (key === 'lang') {
                            const val = (params[key] as string) ?? (param.default as string)
                            return (
                              <div key={key} className="flex gap-1.5">
                                {LANG_OPTIONS.map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setParam(op.id, key, opt)}
                                    className={cn(
                                      'flex-1 text-xs py-1 rounded-lg border transition-colors',
                                      val === opt
                                        ? 'border-accent-strong bg-accent-light text-foreground'
                                        : 'border-border text-muted hover:border-accent-light'
                                    )}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )
                          }

                          if (key === 'algo') {
                            const val = (params[key] as string) ?? (param.default as string)
                            return (
                              <div key={key} className="flex gap-1.5">
                                {ALGO_OPTIONS.map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setParam(op.id, key, opt)}
                                    className={cn(
                                      'flex-1 text-xs py-1 rounded-lg border transition-colors',
                                      val === opt
                                        ? 'border-accent-strong bg-accent-light text-foreground'
                                        : 'border-border text-muted hover:border-accent-light'
                                    )}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )
                          }

                          return null
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

          {customOps.length === 0 && operations.length > 0 && (
            <p className="text-xs text-muted text-center py-2">
              Enable at least one operation to proceed.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
