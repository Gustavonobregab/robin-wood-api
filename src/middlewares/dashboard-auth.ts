import { Elysia } from 'elysia';
import { ApiError } from '../utils/api-error';

// TODO: Import Better Auth client when configured
// import { auth } from '../config/auth';

export const validateDashboardAuth = new Elysia({ name: 'validate-dashboard-auth' })
  .derive({ as: 'scoped' }, async ({ headers }) => {
    // TODO: Implement Better Auth session validation
    // const session = await auth.api.getSession({ headers });

    const authHeader = headers['authorization'];
    const sessionToken = headers['x-session-token'];

    if (!authHeader && !sessionToken) {
      throw new ApiError('AUTH_REQUIRED', 'Authentication is required', 401);
    }

    // TODO: Replace with Better Auth session validation
    // if (!session || !session.user) {
    //   throw new ApiError('SESSION_INVALID', 'Invalid or expired session', 401);
    // }

    // Placeholder - replace with actual Better Auth implementation
    return {
      userId: 'dashboard-user',
      // user: session.user,
      // session: session.session,
    };
  });
