import { Elysia, t } from 'elysia';
import { validateAuth } from '../../middlewares/auth';
import { usersService } from './users.service';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(validateAuth)

  .get('/me', async ({ userId }) => {
    return await usersService.getProfile(userId);
  })

  .patch('/me', async ({ userId, body }) => {
    return await usersService.updateProfile(userId, body);
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
    }),
  })

  .put('/webhook-config', async ({ userId, body }) => {
    return await usersService.updateWebhookUrl(userId, body.url);
  }, {
    body: t.Object({ url: t.String({ format: 'uri' }) }),
  });
