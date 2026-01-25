import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { audioService } from './audio.service';
import { AudioOperationSchema } from './audio.types';

export const audioRoutes = new Elysia({ prefix: '/audio' })
  .use(validateDashboardAuth)

  .post(
    '/',
    async ({ body, userId }) => {
      const result = await audioService.stealAudio(userId, body);
      return {
        data: result
      };    
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
    const result = audioService.listPresets();
    return {
      data: result
    };
  })

  .get('/operations', () => {
    const result = audioService.listOperations();
    return {
      data: result
    };
  })