import { Elysia } from 'elysia';
import { ApiKeyModel } from '../modules/keys/keys.model';
import { ApiError } from '../utils/api-error';

export const validateApiKey = new Elysia({ name: 'validate-api-key' })
  .derive({ as: 'scoped' }, async ({ headers }) => {
    const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      throw new ApiError('API_KEY_REQUIRED', 'API key is required', 401);
    }

    const keyRecord = await ApiKeyModel.findOne({ key: apiKey, status: 'active' });

    if (!keyRecord) {
      throw new ApiError('API_KEY_INVALID', 'Invalid or revoked API key', 401);
    }

    await ApiKeyModel.updateOne({ _id: keyRecord._id }, { lastUsedAt: new Date() });

    return {
      apiKey,
      userId: keyRecord.userId,
    };
  });
