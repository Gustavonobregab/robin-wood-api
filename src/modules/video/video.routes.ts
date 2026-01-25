import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { videoService } from './video.service';
import { VideoOperationSchema } from './video.types';

export const videoRoutes = new Elysia({ prefix: '/video' })
  .use(validateDashboardAuth)

  .post(
    '/',
    async ({ body, userId }) => {
      const result = await videoService.stealVideo(userId, body);
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
          t.Array(VideoOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
    }
  )

  .get('/presets', () => {
    const result = videoService.listPresets();
    return {
      data: result
    };
  })

  .get('/operations', () => {
    const result = videoService.listOperations();
    return {
      data: result
    };
  });
