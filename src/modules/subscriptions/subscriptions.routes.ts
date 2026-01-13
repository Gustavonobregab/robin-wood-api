import { Elysia } from 'elysia';

export const subscriptionsRoutes = new Elysia({ prefix: '/subscriptions' })
  .get('/', async () => {
    // TODO: Implement get subscriptions
    return { subscriptions: [] };
  })
  .post('/', async ({ body }) => {
    // TODO: Implement create subscription
    return { subscription: null };
  });
