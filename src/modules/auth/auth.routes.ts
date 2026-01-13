import { Elysia } from 'elysia';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/validate-key', async ({ body }) => {
    // TODO: Implement key validation
    return { valid: false };
  });
