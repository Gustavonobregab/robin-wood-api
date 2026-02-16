import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/api-key';
import { audioService } from './audio.service';
import { AudioOperationSchema, AudioPresetSchema } from './audio.types';

export const audioRoutes = new Elysia({ prefix: '/audio' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId }) => {
        const { job } = await audioService.processAudio(userId, body);
        return {
          data: job,
        };
      },
    {
      body: t.Object({
        audioUrl: t.String({ format: 'uri' }),
        preset: t.Optional(AudioPresetSchema),
        operations: t.Optional(
          t.Array(AudioOperationSchema, {
            minItems: 1,
            maxItems: 10,
          })
        ),
      }),
      detail: {
        summary: 'Create audio processing job',
        tags: ['Audio'],
      },
    }
  )

  .get('/presets', () => {
    const result = audioService.listPresets();
    return {
      data: result,
    };
  })

  .get('/operations', () => {
    const result = audioService.listOperations();
    return {
      data: result,
    };
  });
