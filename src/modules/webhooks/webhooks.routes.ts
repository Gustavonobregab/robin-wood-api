import { Elysia } from 'elysia';
import { WebhooksService } from './webhooks.service';

export const webhooksRoutes = new Elysia({ prefix: '/webhooks' })
 /* .get('/', async ({ userId, query }) => {
    return await webhooksService.getHistory(userId, Number(query.limit) || 20, Number(query.offset) || 0);
  })
  .post('/:id/retry', async ({ userId, params }) => {
    return await webhooksService.retryEvent(params.id, userId);
  });*/

export default webhooksRoutes;