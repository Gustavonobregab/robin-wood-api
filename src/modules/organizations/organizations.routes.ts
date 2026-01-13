import { Elysia } from 'elysia';

export const organizationsRoutes = new Elysia({ prefix: '/organizations' })
  .get('/', async () => {
    // TODO: Implement get organizations
    return { organizations: [] };
  })
  .post('/', async ({ body }) => {
    // TODO: Implement create organization
    return { organization: null };
  });
