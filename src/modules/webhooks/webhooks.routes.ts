import { Elysia } from 'elysia';

export const webhooksRoutes = new Elysia({ prefix: '/webhooks' })
  .get('/events', async () => {
    // TODO: Implement get webhook events
    return { events: [] };
  })
  .post('/events', async ({ body }) => {
    // TODO: Implement create webhook event
    return { event: null };
  });
