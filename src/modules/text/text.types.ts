import { t, type Static } from 'elysia';

export type TextPreset = 'chill' | 'medium' | 'aggressive' | 'podcast';

// --- OPERAÇÕES DE LIMPEZA E COMPRESSÃO ---

const TrimOperation = t.Object({
  type: t.Literal('trim'),
  params: t.Optional(t.Object({})), 
});

const ShortenOperation = t.Object({
  type: t.Literal('shorten'),
  params: t.Optional(t.Object({
    lang: t.Union([t.Literal('EN'), t.Literal('PT')])
  }))
});

const MinifyOperation = t.Object({
  type: t.Literal('minify'),
  params: t.Optional(t.Object({})),
});

const CompressOperation = t.Object({
  type: t.Literal('compress'),
  params: t.Optional(t.Object({
    algo: t.Union([t.Literal('gzip'), t.Literal('brotli')])
  }))
});

const JsonToToonOperation = t.Object({
  type: t.Literal('json-to-toon'),
  params: t.Optional(t.Object({
    indent: t.Optional(t.Number()),
    compact: t.Optional(t.Boolean()),
  })),
});

// --- UNION PRINCIPAL (SEM REPLACE) ---

export const TextOperationSchema = t.Union([
  TrimOperation,
  ShortenOperation,
  MinifyOperation,
  CompressOperation,
  JsonToToonOperation
]);

export type TextOperation = Static<typeof TextOperationSchema>;

// --- INPUTS ---
// ... (seus imports e operações existentes)

// --- INPUT SCHEMA & TYPE ---

export const ProcessTextSchema = t.Object({
  text: t.String({ minLength: 1 }),
  preset: t.Optional(t.Union([
    t.Literal('chill'),
    t.Literal('medium'),
    t.Literal('aggressive'),
    t.Literal('podcast')
  ])),
  operations: t.Optional(t.Array(TextOperationSchema))
});
export type ProcessTextData = Static<typeof ProcessTextSchema>;
export type StealTextInput = ProcessTextData;

export interface TextDetails {
  charCount: number;
  originalCharCount: number;
}

export interface Metrics {
  compressionRatio: string;
  savedChars: number;
}

export interface PipelineResult<TData, TDetails> {
  data: TData;
  metrics: Metrics;
  details: TDetails;
  operations: string[];
}

export function calculateMetrics(original: number, final: number): Metrics {
  const saved = original - final;
  const ratio = original > 0 ? ((saved / original) * 100).toFixed(2) : '0.00';
  return {
    savedChars: saved,
    compressionRatio: `${ratio}%`
  };
}

// --- DOCUMENTAÇÃO ---

export const TEXT_OPERATIONS = {
  'trim': { name: 'Trim', description: 'Advanced cleaning & punctuation fix', params: {} },
  'shorten': { name: 'Shorten', description: 'Dictionary replacement (PT/EN)', params: { lang: { type: 'string', default: 'EN' } } },
  'minify': { name: 'Minify', description: 'Aggressive compression', params: {} },
  'compress': { name: 'Compress', description: 'Simulate Gzip/Brotli', params: { algo: { type: 'string', default: 'gzip' } } },
  'json-to-toon': { name: 'JSON to Toon', description: 'Convert JSON blocks to TOON', params: {} }
} as const;

export const TEXT_PRESETS = {
    aggressive: {
        name: 'Aggressive',
        description: 'Shorten + Minify',
        operations: [
            { type: 'shorten', params: { lang: 'PT' } },
            { type: 'minify', params: {} }
        ]
    }
} as any;