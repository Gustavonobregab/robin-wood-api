import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { textService } from './text.service';
import { TextOperationSchema } from './text.model';

export const textRoutes = new Elysia({ prefix: '/text' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId }) => {
      const result = await textService.stealText(userId, body);
      return {
        data: result
      };
    },
    {
      body: t.Object({
        file: t.File(), // O Elysia lida com multipart/form-data aqui
        preset: t.Optional(t.Union([
          t.Literal('chill'),
          t.Literal('medium'),
          t.Literal('aggressive'),
          t.Literal('podcast'),
        ])),
        // Validação do array de operações complexas
        operations: t.Optional(
          t.Array(TextOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
      detail: {
        summary: 'Process text file (Steal Text)',
        tags: ['Text']
      }
    }
  )

  .get('/presets', () => {
    const result = textService.listPresets();
    return {
      data: result
    };
  })

  .get('/operations', () => {
    const result = textService.listOperations();
    return {
      data: result
    };
  });