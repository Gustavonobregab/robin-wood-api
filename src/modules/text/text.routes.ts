import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { textService } from './text.service';
import { TextOperationSchema, TextPresetSchema } from './text.types';

export const textRoutes = new Elysia({ prefix: '/text' })
  .use(validateDashboardAuth)

  .post(
    '/',
    async ({ body, userId }) => {
      const { job } = await textService.processText(userId, body);
      return {
        data: job,
      };
    },
    {
      body: t.Object({
        textUrl: t.String({ format: 'uri' }),
        preset: t.Optional(TextPresetSchema),
        operations: t.Optional(
          t.Array(TextOperationSchema, {
            minItems: 1,
            maxItems: 10,
          })
        ),
      }),
      detail: {
        summary: 'Create text processing job',
        tags: ['Text'],
      },
    }
  )

  .get('/presets', () => {
    const result = textService.listPresets();
    return {
      data: result,
    };
  })

  .get('/operations', () => {
    const result = textService.listOperations();
    return {
      data: result,
    };
  });
