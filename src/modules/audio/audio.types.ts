import { PipelineResult } from '../../pipeline';

import { t, type Static } from 'elysia';

export type AudioPreset = 'chill' | 'medium' | 'aggressive' | 'podcast';

const CompressOperation = t.Object({
  type: t.Literal('compress'),
  params: t.Optional(t.Object({
    ratio: t.Number({ minimum: 1, maximum: 20 }),
    threshold: t.Number({ minimum: -60, maximum: 0 }),
  })),
});

const NormalizeOperation = t.Object({
  type: t.Literal('normalize'),
  params: t.Optional(t.Object({
    targetLevel: t.Number({ minimum: -70, maximum: 0 }),
    peakNormalize: t.Boolean(),
  })),
});

const TrimSilenceOperation = t.Object({
  type: t.Literal('trim-silence'),
  params: t.Optional(t.Object({
    aggressiveness: t.Number({ minimum: 0, maximum: 1 }),
    minSilenceDuration: t.Number({ minimum: 100, maximum: 5000 }),
  })),
});

export const AudioOperationSchema = t.Union([
  CompressOperation,
  NormalizeOperation,
  TrimSilenceOperation,
]);

export type AudioOperation = Static<typeof AudioOperationSchema>;

export interface StealAudioInput {
  file: File;
  preset?: AudioPreset;
  operations?: AudioOperation[];
}

export const AUDIO_OPERATIONS = {
  'trim-silence': {
    name: 'Trim Silence',
    description: 'Remove silent parts from audio',
    params: {
      aggressiveness: { type: 'number', min: 0, max: 1, default: 0.5 },
      minSilenceDuration: { type: 'number', min: 100, max: 5000, default: 500 },
    },
  },
  'normalize': {
    name: 'Normalize',
    description: 'Normalize audio volume levels',
    params: {
      targetLevel: { type: 'number', min: -70, max: 0, default: -14 },
      peakNormalize: { type: 'boolean', default: false },
    },
  },
  'compress': {
    name: 'Compress',
    description: 'Apply dynamic range compression',
    params: {
      ratio: { type: 'number', min: 1, max: 20, default: 4 },
      threshold: { type: 'number', min: -60, max: 0, default: -20 },
      attack: { type: 'number', min: 0, max: 100, default: 10 },
      release: { type: 'number', min: 0, max: 1000, default: 100 },
    },
  },
} as const;

export const AUDIO_PRESETS = {
  chill: {
    name: 'Chill',
    description: 'Light processing, preserves original dynamics',
    operations: [
      { type: 'trim-silence', params: { aggressiveness: 0.2 } },
      { type: 'normalize', params: { targetLevel: -16 } },
    ],
  },
  medium: {
    name: 'Medium',
    description: 'Balanced processing for general use',
    operations: [
      { type: 'trim-silence', params: { aggressiveness: 0.5 } },
      { type: 'normalize', params: { targetLevel: -14 } },
      { type: 'compress', params: { ratio: 3, threshold: -24 } },
    ],
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Heavy processing, maximizes loudness',
    operations: [
      { type: 'trim-silence', params: { aggressiveness: 0.8 } },
      { type: 'normalize', params: { targetLevel: -10 } },
      { type: 'compress', params: { ratio: 8, threshold: -18 } },
    ],
  },
  podcast: {
    name: 'Podcast',
    description: 'Optimized for voice content',
    operations: [
      { type: 'trim-silence', params: { aggressiveness: 0.6, minSilenceDuration: 800 } },
      { type: 'normalize', params: { targetLevel: -16, peakNormalize: false } },
      { type: 'compress', params: { ratio: 4, threshold: -20, attack: 5, release: 150 } },
    ],
  },
} as const;

export type AudioData = Buffer | ArrayBuffer | Uint8Array;

export interface AudioDetails {
  duration: number;         // Em segundos
  sampleRate: number;       // Ex: 44100
  originalDuration: number; // Em segundos
  silenceRemoved: number;   // Em segundos
}

export type AudioResult = PipelineResult<AudioData, AudioDetails>;

export function calculateMetrics(originalSize: number, finalSize: number) {
  const saved = originalSize - finalSize;
  const ratio = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(2) : '0.00';
  
  return {
    savedBytes: saved,
    compressionRatio: `${ratio}%`
  };
}