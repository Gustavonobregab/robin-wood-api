import { t, type Static } from 'elysia';

export type VideoPreset = 'chill' | 'medium' | 'aggressive' | 'podcast';

const TranscodeOperation = t.Object({
  type: t.Literal('transcode'),
  params: t.Optional(t.Object({
    codec: t.Optional(t.Union([
      t.Literal('h264'),
      t.Literal('h265'),
      t.Literal('vp9'),
    ])),
    format: t.Optional(t.Union([
      t.Literal('mp4'),
      t.Literal('webm'),
      t.Literal('mov'),
    ])),
  })),
});

const CompressOperation = t.Object({
  type: t.Literal('compress'),
  params: t.Optional(t.Object({
    quality: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
    maxBitrate: t.Optional(t.Number({ minimum: 100, maximum: 50000 })),
  })),
});

const TrimOperation = t.Object({
  type: t.Literal('trim'),
  params: t.Optional(t.Object({
    start: t.Optional(t.Number({ minimum: 0 })),
    end: t.Optional(t.Number({ minimum: 0 })),
  })),
});

export const VideoOperationSchema = t.Union([
  TranscodeOperation,
  CompressOperation,
  TrimOperation,
]);

export type VideoOperation = Static<typeof VideoOperationSchema>;

export interface StealVideoInput {
  file: File;
  preset?: VideoPreset;
  operations?: VideoOperation[];
}

export const VIDEO_OPERATIONS = {
  'transcode': {
    name: 'Transcode',
    description: 'Convert video codec and format',
    params: {
      codec: { type: 'string', options: ['h264', 'h265', 'vp9'], default: 'h264' },
      format: { type: 'string', options: ['mp4', 'webm', 'mov'], default: 'mp4' },
    },
  },
  'compress': {
    name: 'Compress',
    description: 'Compress video file size',
    params: {
      quality: { type: 'number', min: 1, max: 100, default: 75 },
      maxBitrate: { type: 'number', min: 100, max: 50000, default: 5000 },
    },
  },
  'trim': {
    name: 'Trim',
    description: 'Trim video by start and end time',
    params: {
      start: { type: 'number', min: 0, default: 0 },
      end: { type: 'number', min: 0 },
    },
  },
} as const;

export const VIDEO_PRESETS = {
  chill: {
    name: 'Chill',
    description: 'Light compression, preserves quality',
    operations: [
      { type: 'compress', params: { quality: 90 } },
    ],
  },
  medium: {
    name: 'Medium',
    description: 'Balanced compression',
    operations: [
      { type: 'transcode', params: { codec: 'h264', format: 'mp4' } },
      { type: 'compress', params: { quality: 75, maxBitrate: 5000 } },
    ],
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Maximum compression',
    operations: [
      { type: 'transcode', params: { codec: 'h265', format: 'mp4' } },
      { type: 'compress', params: { quality: 50, maxBitrate: 2000 } },
    ],
  },
  podcast: {
    name: 'Podcast',
    description: 'Optimized for video podcasts',
    operations: [
      { type: 'transcode', params: { codec: 'h264', format: 'mp4' } },
      { type: 'compress', params: { quality: 80, maxBitrate: 4000 } },
    ],
  },
} as const;
