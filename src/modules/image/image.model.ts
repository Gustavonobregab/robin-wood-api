import { t, type Static } from 'elysia';

export type ImagePreset = 'chill' | 'medium' | 'aggressive' | 'podcast';

const ResizeOperation = t.Object({
  type: t.Literal('resize'),
  params: t.Optional(t.Object({
    width: t.Optional(t.Number({ minimum: 1, maximum: 8192 })),
    height: t.Optional(t.Number({ minimum: 1, maximum: 8192 })),
    fit: t.Optional(t.Union([
      t.Literal('cover'),
      t.Literal('contain'),
      t.Literal('fill'),
    ])),
  })),
});

const CompressOperation = t.Object({
  type: t.Literal('compress'),
  params: t.Optional(t.Object({
    quality: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
    format: t.Optional(t.Union([
      t.Literal('jpeg'),
      t.Literal('png'),
      t.Literal('webp'),
    ])),
  })),
});

export const ImageOperationSchema = t.Union([
  ResizeOperation,
  CompressOperation,
]);

export type ImageOperation = Static<typeof ImageOperationSchema>;

export interface StealImageInput {
  file: File;
  preset?: ImagePreset;
  operations?: ImageOperation[];
}

export const IMAGE_OPERATIONS = {
  'resize': {
    name: 'Resize',
    description: 'Resize image dimensions',
    params: {
      width: { type: 'number', min: 1, max: 8192 },
      height: { type: 'number', min: 1, max: 8192 },
      fit: { type: 'string', options: ['cover', 'contain', 'fill'], default: 'cover' },
    },
  },
  'compress': {
    name: 'Compress',
    description: 'Compress and optimize image',
    params: {
      quality: { type: 'number', min: 1, max: 100, default: 80 },
      format: { type: 'string', options: ['jpeg', 'png', 'webp'], default: 'webp' },
    },
  },
} as const;

export const IMAGE_PRESETS = {
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
      { type: 'compress', params: { quality: 75, format: 'webp' } },
    ],
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Maximum compression',
    operations: [
      { type: 'resize', params: { width: 1920, fit: 'contain' } },
      { type: 'compress', params: { quality: 60, format: 'webp' } },
    ],
  },
  podcast: {
    name: 'Podcast',
    description: 'Optimized for thumbnails and covers',
    operations: [
      { type: 'resize', params: { width: 1400, height: 1400, fit: 'cover' } },
      { type: 'compress', params: { quality: 85, format: 'jpeg' } },
    ],
  },
} as const;
