import { Elysia, t } from 'elysia';
import { KeysService } from './keys.service';

const keysService = new KeysService();

export const keysRoutes = new Elysia({ prefix: '/keys' })
  .get('/', async () => {
    // TODO: Implement get keys
    return { keys: [] };
  })
  .post('/', async ({ body }) => {
    // TODO: Implement create key
    return { key: null };
  })  
  .post(
    '/validate-key',
    async ({ body }) => {
      return await keysService.validateApiKey(body.apiKey);
    },
    {
      body: t.Object({ apiKey: t.String({ minLength: 1 }) }),
    }
  );