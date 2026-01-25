import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { usersService } from './users.service';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(validateDashboardAuth) 

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