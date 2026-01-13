import { Elysia } from 'elysia';

export const keysRoutes = new Elysia({ prefix: '/keys' })
  .get('/', async () => {
    // TODO: Implement get keys
    return { keys: [] };
  })
  .post('/', async ({ body }) => {
    // TODO: Implement create key
    return { key: null };
  });
