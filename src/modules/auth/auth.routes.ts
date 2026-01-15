import { Elysia, t } from 'elysia';
import { authService } from './auth.service';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/validate-key',
    async ({ body }) => {
      return await authService.validateApiKey(body.apiKey);
    },
    {
      body: t.Object({
        apiKey: t.String({ minLength: 1 }),
      }),
    }
  );
