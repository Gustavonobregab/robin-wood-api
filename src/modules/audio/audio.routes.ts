import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { audioService } from './audio.service';
import { AudioOperationSchema } from './audio.model';

export const audioRoutes = new Elysia({ prefix: '/audio' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId }) => {
      return await audioService.stealAudio(userId, body);
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

  .get('/presets', () => {
    return audioService.listPresets();
  })

  .get('/operations', () => {
    return audioService.listOperations();
  })