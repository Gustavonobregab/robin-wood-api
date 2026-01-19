import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
// Importe seu middleware de sessão se for diferente do de API Key
// import { ensureSession } from '../../middlewares/ensure-session'; 
import { usersService } from './users.service';

export const usersRoutes = new Elysia({ prefix: '/users' })
  // Aplica o middleware (garante que temos o userId)
  .use(validateApiKey) 

  // GET: Status do Plano Gratuito
  .get('/me/free-tier', async ({ userId }) => {
    return await usersService.getFreeTierStatus(userId);
  })

  // PUT: Configurar Webhook
  .put('/webhook-config', async ({ userId, body, set }) => { // <--- Troque 'error' por 'set'
    try {
      return await usersService.updateWebhookUrl(userId, body.url);
    } catch (e: any) {
      // Define o status HTTP
      set.status = 400;
      // Retorna o JSON de erro
      return { error: e.message };
    }
  }, {
    body: t.Object({
      url: t.String({ format: 'uri' })
    }),
    detail: {
      summary: 'Atualiza a URL de Webhook do usuário'
    }
  });