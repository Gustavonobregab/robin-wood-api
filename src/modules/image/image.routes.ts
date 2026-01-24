import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { imageService } from './image.service';
import { ImageOperationSchema } from './image.model';

export const imageRoutes = new Elysia({ prefix: '/image' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId }) => {
      return await imageService.stealImage(userId, body);
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
    return imageService.listPresets();
  })

  .get('/operations', () => {
    return imageService.listOperations();
  });
