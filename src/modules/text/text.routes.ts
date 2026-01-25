import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { textService } from './text.service';
import { TextOperationSchema } from './text.model';

export const textRoutes = new Elysia({ prefix: '/text' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId, set }) => { // Adicionei 'set' aqui
      try {
        // O body já vem validado pelo schema abaixo (File, Preset, etc)
        return await textService.stealText(userId, body);
        
      } catch (error: any) {
        // Captura o status do ApiError ou usa 500 como fallback
        set.status = error.status || 500;
        return { 
          error: error.message || 'Internal Server Error',
          code: error.code || 'INTERNAL_ERROR'
        };
      }
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
    return textService.listPresets();
  })

  .get('/operations', () => {
    return textService.listOperations();
  });