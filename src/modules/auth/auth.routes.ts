import { Elysia, t } from 'elysia';
import { authService } from './auth.service';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/validate-key',
    async ({ body, set }) => {
      const result = await authService.validateApiKey(body.apiKey);

      if (!result.valid) {
        set.status = 401;
      }

      return { data: result };
    },
    {
      body: t.Object({
        apiKey: t.String({ minLength: 1 }),
      }),
    }
  );
