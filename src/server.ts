import { Elysia } from 'elysia';
import { connectDatabase } from './config/database';
import { authRoutes } from './modules/auth/auth.routes';
import { keysRoutes } from './modules/keys/keys.routes';
import { usageRoutes } from './modules/usage/usage.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes';
import { organizationsRoutes } from './modules/organizations/organizations.routes';
import { webhooksRoutes } from './modules/webhooks/webhooks.routes';

const app = new Elysia()
  .get('/', () => ({ message: 'Robin Wood API' }))
  .use(authRoutes)
  .use(keysRoutes)
  .use(usageRoutes)
  .use(billingRoutes)
  .use(subscriptionsRoutes)
  .use(organizationsRoutes)
  .use(webhooksRoutes);

async function start() {
  try {
    await connectDatabase();
    app.listen(3000);
    console.log('🚀 Server is running on http://localhost:3000');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
