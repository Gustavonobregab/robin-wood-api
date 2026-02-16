import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/api-key';
import { usersService } from './users.service';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(validateApiKey)

  .get('/me', async ({ userId }) => {
    const result = await usersService.getProfile(userId);
    return { data: result };
  })

  .patch('/me', async ({ userId, body }) => {
    const result = await usersService.updateProfile(userId, body);
    return { data: result };
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
    }),
  })

  .put('/webhook-config', async ({ userId, body }) => {
    const result = await usersService.updateWebhookUrl(userId, body.url);
    return { data: result };
  }, {
    body: t.Object({ url: t.String({ format: 'uri' }) }),
  });
