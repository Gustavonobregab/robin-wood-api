import { Elysia } from 'elysia';
import { ApiKeyModel } from '../modules/keys/keys.model';

export const validateApiKey = new Elysia({ name: 'validate-api-key' })
  .derive({ as: 'scoped' }, async ({ headers, set }) => {
    const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      set.status = 401;
      throw new Error('API key is required');
    }

    const keyRecord = await ApiKeyModel.findOne({ key: apiKey, status: 'active' });

    if (!keyRecord) {
      set.status = 401;
      throw new Error('Invalid or revoked API key');
    }

    await ApiKeyModel.updateOne({ _id: keyRecord._id }, { lastUsedAt: new Date() });

    return {
      apiKey,
      userId: keyRecord.userId,
    };
  });
