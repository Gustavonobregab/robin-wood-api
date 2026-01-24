import { t, type Static } from 'elysia';

export type TextPreset = 'chill' | 'medium' | 'aggressive' | 'podcast';

const JsonToToonOperation = t.Object({
  type: t.Literal('json-to-toon'),
  params: t.Optional(t.Object({
    indent: t.Optional(t.Number({ minimum: 0, maximum: 8 })),
    compact: t.Optional(t.Boolean()),
  })),
});

const SyntaxOperation = t.Object({
  type: t.Literal('syntax'),
  params: t.Optional(t.Object({
    language: t.Optional(t.String()),
    strict: t.Optional(t.Boolean()),
  })),
});

export const TextOperationSchema = t.Union([
  JsonToToonOperation,
  SyntaxOperation,
]);

export type TextOperation = Static<typeof TextOperationSchema>;

export interface StealTextInput {
  file: File;
  preset?: TextPreset;
  operations?: TextOperation[];
}

export const TEXT_OPERATIONS = {
  'json-to-toon': {
    name: 'JSON to TOON',
    description: 'Convert JSON to TOON format',
    params: {
      indent: { type: 'number', min: 0, max: 8, default: 2 },
      compact: { type: 'boolean', default: false },
    },
  },
  'syntax': {
    name: 'Syntax',
    description: 'Validate and format syntax',
    params: {
      language: { type: 'string', default: 'auto' },
      strict: { type: 'boolean', default: false },
    },
  },
} as const;

export const TEXT_PRESETS = {
  chill: {
    name: 'Chill',
    description: 'Light processing with basic formatting',
    operations: [
      { type: 'syntax', params: { strict: false } },
    ],
  },
  medium: {
    name: 'Medium',
    description: 'Balanced processing',
    operations: [
      { type: 'syntax', params: { strict: true } },
    ],
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Full validation and formatting',
    operations: [
      { type: 'syntax', params: { strict: true } },
      { type: 'json-to-toon', params: { indent: 2, compact: false } },
    ],
  },
  podcast: {
    name: 'Podcast',
    description: 'Optimized for transcription content',
    operations: [
      { type: 'syntax', params: { strict: false } },
      { type: 'json-to-toon', params: { indent: 0, compact: true } },
    ],
  },
} as const;
