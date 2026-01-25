import { Elysia } from 'elysia';

export const billingRoutes = new Elysia({ prefix: '/billing' })
  .get('/current', async () => {
    // TODO: Implement get current billing
    return {
      data: { billing: null }
    };
  });
