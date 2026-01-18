import { Elysia } from 'elysia';
import { connectDatabase } from './config/database';
import { apiErrorPlugin } from './lib/api-error';
import { keysRoutes } from './modules/keys/keys.routes';
import { usageRoutes } from './modules/usage/usage.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes';
import { webhooksRoutes } from './modules/webhooks/webhooks.routes';
import { usersRoutes } from './modules/users/users.routes';

const app = new Elysia()
  .use(apiErrorPlugin)
  .get('/', () => ({ message: 'Robin Wood API' }))
  .use(keysRoutes)
  .use(usageRoutes)
  .use(billingRoutes)
  .use(subscriptionsRoutes)
  .use(webhooksRoutes)
  .use(usersRoutes);

async function start() {
  try {
    await connectDatabase();
    app.listen(3000);
    console.log('Server is running on http://localhost:3000');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
