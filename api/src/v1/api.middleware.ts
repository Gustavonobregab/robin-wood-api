import { Elysia } from 'elysia';
import { keysService } from '../modules/keys/keys.service';
import { ApiError } from '../utils/api-error';

export const apiKeyAuth = new Elysia({ name: 'api-key-auth' })
  .derive({ as: 'scoped' }, async ({ request, set }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw new ApiError('API_KEY_REQUIRED', 'Authorization header is required', 401);
    }

    if (!authHeader.startsWith('Bearer sk_live_')) {
      throw new ApiError('INVALID_API_KEY_FORMAT', 'Invalid API key format. Expected: Bearer sk_live_*', 401);
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const { userId, keyId } = await keysService.validateApiKey(apiKey);

    const requestId = `req_${crypto.randomUUID()}`;
    set.headers['X-Request-Id'] = requestId;

    return {
      userId,
      apiKeyId: keyId,
      requestId,
    };
  });
