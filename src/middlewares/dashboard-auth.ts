import { Elysia } from 'elysia';
import { ApiError } from '../utils/api-error';
import { auth } from '../auth/better-auth';

export const validateDashboardAuth = new Elysia({ name: 'validate-dashboard-auth' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      throw new ApiError('AUTH_REQUIRED', 'Authentication is required', 401);
    }

    return {
      userId: session.user.id,
      user: session.user,
      session: session.session
    };
  });