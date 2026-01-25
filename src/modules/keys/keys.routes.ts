import { Elysia, t } from 'elysia';
import { KeysService } from './keys.service';

const keysService = new KeysService();

export const keysRoutes = new Elysia({ prefix: '/keys' })
  .get('/', async () => {
    // TODO: Implement get keys
    return {
      data: { keys: [] }
    };
  })
  .post('/', async ({ body }) => {
    // TODO: Implement create key
    return {
      data: { key: null }
    };
  })  
  .post(
    '/validate-key',
    async ({ body }) => {
      const result = await keysService.validateApiKey(body.apiKey);
      return {
        data: result
      };
    },
    {
      body: t.Object({ apiKey: t.String({ minLength: 1 }) }),
    }
  );