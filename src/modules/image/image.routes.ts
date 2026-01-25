import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/validate-dashboard-auth';
import { imageService } from './image.service';
import { ImageOperationSchema } from './image.model';

export const imageRoutes = new Elysia({ prefix: '/image' })
  .use(validateDashboardAuth)

  .post(
    '/',
    async ({ body, userId }) => {
      const result = await imageService.stealImage(userId, body);
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
          t.Array(ImageOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
    }
  )

  .get('/presets', () => {
    const result = imageService.listPresets();
    return {
      data: result
    };
  })

  .get('/operations', () => {
    const result = imageService.listOperations();
    return {
      data: result
    };
  });
