import { Elysia, t } from 'elysia';
import { keysService } from './keys.service';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';

export const keysRoutes = new Elysia({ prefix: '/keys' })
  .post(
    '/validate',
    async ({ body }) => {
      const result = await keysService.validateApiKey(body.apiKey);
      return { data: result };
    },
    {
      body: t.Object({ apiKey: t.String({ minLength: 1 }) }),
    }
  )
  .use(validateDashboardAuth)
  .get('/', async ({ userId }) => {
    const keys = await keysService.getKeysByUserId(userId);
    return { data: { keys } };
  })
  .post(
    '/',
    async ({ userId, body }) => {
      const apiKey = await keysService.createKey(userId, body.name);

      return {
        data: {
          key: apiKey,
        }
      };
    },
    {
      body: t.Object({ name: t.String({ minLength: 1, maxLength: 50 }) }),
    }
  )
  .get(
    '/:id',
    async ({ userId, params }) => {
      const key = await keysService.getKeyById(userId, params.id);
      return { data: { key } };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  .delete(
    '/:id',
    async ({ userId, params }) => {
      await keysService.revokeKey(userId, params.id);
      return { data: { message: 'API key revoked successfully' } };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );