import { Elysia } from 'elysia';

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .post('/', async ({ body }) => {
    // TODO: Implement batch usage recording
    return { success: true };
  });
