import { Elysia, t } from 'elysia';
import { validateAuth } from '../../middlewares/auth';
import { usageService } from './usage.service';

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .use(validateAuth)

  .get('/current', async ({ userId }) => {
    return await usageService.getCurrentUsage(userId);
  })

  .get('/analytics', async ({ userId, query }) => {
    return await usageService.getAnalytics(userId, query.range ?? '30d');
  }, {
    query: t.Object({
      range: t.Optional(t.Union([
        t.Literal('7d'),
        t.Literal('30d'),
        t.Literal('90d'),
        t.Literal('1y'),
      ])),
    }),
  });
