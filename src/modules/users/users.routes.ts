import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { usersService } from './users.service';
import { usageService } from '../usage/usage.service';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(validateDashboardAuth)

  .get('/me/tokens', async ({ userId }) => {
    const result = await usageService.getCurrentUsage(userId);
    return { data: result };
  })

  .put('/webhook-config', async ({ userId, body }) => {
    const result = await usersService.updateWebhookUrl(userId, body.url);
    return { data: result };
  }, {
    body: t.Object({
      url: t.String({ format: 'uri' })
    }),
  });
