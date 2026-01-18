import { Elysia } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { usersService } from './users.service';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(validateApiKey)

  .get('/me/free-tier', async ({ userId }) => {
    return await usersService.getFreeTierStatus(userId);
  });
