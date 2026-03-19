import { Elysia } from 'elysia';
import { auth } from '../config/auth';
import { ApiError } from '../utils/api-error';

export const validateAuth = new Elysia({ name: 'validate-auth' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new ApiError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    return {
      userId: session.user.id,
    };
  });
