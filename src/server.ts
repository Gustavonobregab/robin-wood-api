import { Elysia } from 'elysia';
import { connectDatabase } from './config/database';
//import { apiErrorPlugin } from './utils/api-error';
import { cors } from '@elysiajs/cors';

try {
  await connectDatabase();
  console.log('Database connected');
} catch (error) {
  console.error('Failed to connect to database:', error);
  process.exit(1);
}

const { authRoutes } = await import('./auth/auth.routes');
const { keysRoutes } = await import('./modules/keys/keys.routes');
const { usageRoutes } = await import('./modules/usage/usage.routes');
const { billingRoutes } = await import('./modules/billing/billing.routes');
const { subscriptionsRoutes } = await import('./modules/subscriptions/subscriptions.routes');
const { usersRoutes } = await import('./modules/users/users.routes');
const { audioRoutes } = await import('./modules/audio/audio.routes');
const { textRoutes } = await import('./modules/text/text.routes');
const { imageRoutes } = await import('./modules/image/image.routes');
const { videoRoutes } = await import('./modules/video/video.routes');
const { default: webhooksRoutes } = await import('./modules/webhooks/webhooks.routes'); // Nota: webhooks parece ser export default
const { apiRoutes } = await import('./modules/api/api.routes');

const app = new Elysia()
  .use(cors({
      origin: "http://localhost:3333",
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], 
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })).get('/health', () => {
    return { 
      status: 'online', 
      uptime: process.uptime() 
    };
  })
  //.use(apiErrorPlugin)
  .use(authRoutes)
  .get('/', () => ({ message: 'Robin Wood API' }))
  .use(keysRoutes)
  .use(usageRoutes)
  .use(billingRoutes)
  .use(subscriptionsRoutes)
  .use(webhooksRoutes)
  .use(usersRoutes)
  .use(audioRoutes)
  .use(textRoutes)
  .use(imageRoutes)
  .use(videoRoutes)
  .use(apiRoutes);

app.listen(3000);
console.log('🦊 Server is running on http://localhost:3000');