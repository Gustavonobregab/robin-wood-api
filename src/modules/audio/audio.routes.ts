import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { audioService } from './audio.service';
import { AudioOperationSchema } from './audio.types';

export const audioRoutes = new Elysia({ prefix: '/audio' })
  .use(validateDashboardAuth)

  .post(
    '/',
    async ({ body, userId }) => {
        const { job } = await audioService.createAudioJob(userId, body);
        return {
          data: job,
        };
      },
    {
      body: t.Object({
        file: t.File(),
        preset: t.Optional(
          t.Union([
            t.Literal('chill'),
            t.Literal('medium'),
            t.Literal('aggressive'),
            t.Literal('podcast'),
            t.Literal('lecture'),
          ])
        ),
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
