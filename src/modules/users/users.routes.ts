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
    const result = await usersService.getFreeTierStatus(userId);
    return {
      data: result
    };
  })

  // PUT: Configurar Webhook
  .put('/webhook-config', async ({ userId, body }) => {
    const result = await usersService.updateWebhookUrl(userId, body.url);
    return {
      data: result
    };
  }, {
    body: t.Object({
      url: t.String({ format: 'uri' })
    }),
    detail: {
      summary: 'Atualiza a URL de Webhook do usuário'
    }
  });