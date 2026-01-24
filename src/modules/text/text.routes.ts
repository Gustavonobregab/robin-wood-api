import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { textService } from './text.service';
import { TextOperationSchema } from './text.model';

export const textRoutes = new Elysia({ prefix: '/text' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId }) => {
      return await textService.stealText(userId, body);
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

  .get('/presets', () => {
    return textService.listPresets();
  })

  .get('/operations', () => {
    return textService.listOperations();
  });
