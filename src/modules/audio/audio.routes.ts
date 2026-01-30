import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { audioService } from './audio.service';
import { AudioOperationSchema } from './audio.types';

export const audioRoutes = new Elysia({ prefix: '/audio' })
  .use(validateDashboardAuth)

  .post(
    '/',
    async ({ body, userId, set }) => {
      try {
        // Tenta processar o áudio
        const result = await audioService.stealAudio(userId, body);
        
        return {
          data: result
        };

      } catch (error: any) {
        // --- AQUI ESTÁ A MODIFICAÇÃO PARA DEBUG ---
        console.error("❌ ERRO CRÍTICO NO AUDIO SERVICE:", error);
        // ------------------------------------------

        // Define o status HTTP correto (400 ou 500)
        set.status = error.status || 500;
        
        // Retorna o erro formatado para o cliente
        return {
          success: false,
          error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'Internal Server Error'
          }
        };
      }
    },
    {
      body: t.Object({
        file: t.File(),
        preset: t.Optional(t.Union([
          t.Literal('chill'),
          t.Literal('medium'),
          t.Literal('aggressive'),
          t.Literal('podcast'),
          t.Literal('lecture')
        ])),
        operations: t.Optional(
          t.Array(AudioOperationSchema, {
            minItems: 1,
            maxItems: 10,
          }),
        ),
      }),
      detail: {
        summary: 'Process audio file (Steal Audio)',
        tags: ['Audio']
      }
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
  });