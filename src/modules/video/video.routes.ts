import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { videoService } from './video.service';
import { VideoOperationSchema } from './video.model';

export const videoRoutes = new Elysia({ prefix: '/video' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId }) => {
      return await videoService.stealVideo(userId, body);
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
    return videoService.listPresets();
  })

  .get('/operations', () => {
    return videoService.listOperations();
  });
