import { Elysia } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { usageService } from './usage.service';

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .use(validateDashboardAuth)

  .get('/current', async ({ userId }) => {
    const result = await usageService.getCurrentUsage(userId);
    return { data: result };
  })

  .get('/limits', async ({ userId }) => {
    const result = await usageService.checkLimits(userId);
    return { data: result };
  });
