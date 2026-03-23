import { Elysia } from 'elysia';
import { apiKeyAuth } from './api.middleware';
import { apiRoutes } from './api.routes';

export const v1Routes = new Elysia({ prefix: '/v1' })
  .use(apiKeyAuth)
  .use(apiRoutes);
