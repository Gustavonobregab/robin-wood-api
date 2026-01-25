import { Elysia, t } from 'elysia';
import { apiService } from './api.service';
import { validateApiKey } from '../../middlewares/api-key';
import { AudioOperationSchema } from '../audio/audio.types';
import { TextOperationSchema } from '../text/text.types';
import { ImageOperationSchema } from '../image/image.types';
import { VideoOperationSchema } from '../video/video.types';

export const apiRoutes = new Elysia({ prefix: '/api' })
  .use(validateApiKey)

  .post(
    '/audio',
    async ({ body, userId, apiKeyId }) => {
      const result = await apiService.processAudio(userId, body, { apiKeyId });
      return { data: result };
    },
    {
      body: t.Object({
        file: t.File(),
        preset: t.Optional(t.Union([
          t.Literal('chill'),
          t.Literal('medium'),
          t.Literal('aggressive'),
          t.Literal('podcast'),
        ])),
        operations: t.Optional(
          t.Array(AudioOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
    }
  )

  .get('/audio/presets', () => {
    const result = apiService.listAudioPresets();
    return { data: result };
  })

  .get('/audio/operations', () => {
    const result = apiService.listAudioOperations();
    return { data: result };
  })

  .post(
    '/text',
    async ({ body, userId, apiKeyId }) => {
      const result = await apiService.processText(userId, body, { apiKeyId });
      return { data: result };
    },
    {
      body: t.Object({
        file: t.File(),
        preset: t.Optional(t.Union([
          t.Literal('chill'),
          t.Literal('medium'),
          t.Literal('aggressive'),
          t.Literal('podcast'),
        ])),
        operations: t.Optional(
          t.Array(TextOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
    }
  )

  .get('/text/presets', () => {
    const result = apiService.listTextPresets();
    return { data: result };
  })

  .get('/text/operations', () => {
    const result = apiService.listTextOperations();
    return { data: result };
  })

  .post(
    '/image',
    async ({ body, userId }) => {
      const result = await apiService.processImage(userId, body);
      return { data: result };
    },
    {
      body: t.Object({
        file: t.File(),
        preset: t.Optional(t.Union([
          t.Literal('chill'),
          t.Literal('medium'),
          t.Literal('aggressive'),
          t.Literal('podcast'),
        ])),
        operations: t.Optional(
          t.Array(ImageOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
    }
  )

  .get('/image/presets', () => {
    const result = apiService.listImagePresets();
    return { data: result };
  })

  .get('/image/operations', () => {
    const result = apiService.listImageOperations();
    return { data: result };
  })

  .post(
    '/video',
    async ({ body, userId }) => {
      const result = await apiService.processVideo(userId, body);
      return { data: result };
    },
    {
      body: t.Object({
        file: t.File(),
        preset: t.Optional(t.Union([
          t.Literal('chill'),
          t.Literal('medium'),
          t.Literal('aggressive'),
          t.Literal('podcast'),
        ])),
        operations: t.Optional(
          t.Array(VideoOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
    }
  )

  .get('/video/presets', () => {
    const result = apiService.listVideoPresets();
    return { data: result };
  })

  .get('/video/operations', () => {
    const result = apiService.listVideoOperations();
    return { data: result };
  });
