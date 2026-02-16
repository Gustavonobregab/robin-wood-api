import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/api-key';
import { usageService } from './usage.service';

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .use(validateApiKey)

  .get('/current', async ({ userId }) => {
    const result = await usageService.getCurrentUsage(userId);
    return { data: result };
  })

  // 👇 NOVA ROTA: Analítica para o Gráfico e Stats
  .get('/analytics', async ({ userId, query }) => {
    const range = (query.range || '30d') as '7d' | '30d' | '90d' | '1y';
    const result = await usageService.getAnalytics(userId, range);
    return { data: result };
  }, {
    query: t.Object({
      range: t.Optional(t.String())
    })
  })

  .get('/limits', async ({ userId }) => {
    const result = await usageService.checkLimits(userId);
    return { data: result };
  });