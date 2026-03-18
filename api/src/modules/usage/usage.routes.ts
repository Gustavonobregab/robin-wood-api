import { Elysia, t } from 'elysia';
import { validateAuth } from '../../middlewares/auth';
import { usageService } from './usage.service';

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .use(validateAuth)

  .get('/current', async ({ userId }) => {
    const result = await usageService.getCurrentUsage(userId);
    return { data: result };
  })

  .get('/analytics', async ({ userId, query }) => {
    const result = await usageService.getAnalytics(userId, query.range ?? '30d');
    return { data: result };
  }, {
    query: t.Object({
      range: t.Optional(t.Union([
        t.Literal('7d'),
        t.Literal('30d'),
        t.Literal('90d'),
        t.Literal('1y'),
      ])),
    }),
  })

  .get('/limits', async ({ userId }) => {
    const result = await usageService.checkLimits(userId);
    return { data: result };
  });