import { Elysia } from 'elysia';
import { plansService } from './plans.service';

export const plansRoutes = new Elysia({ prefix: '/plans' })
  .get('/', async () => {
    const plans = await plansService.getPublicPlans();
    return plans;
  })
  .get('/:slug', async ({ params }) => {
    const plan = await plansService.getPlanBySlug(params.slug);
    return plan;
  });
