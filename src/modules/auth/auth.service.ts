import { ApiKeyModel } from '../keys/keys.model';
import { ApiError } from '../../lib/api-error';

export const authService = {
  async validateApiKey(key: string) {
    if (!key) {
      throw new ApiError('API_KEY_REQUIRED', 'API key is required', 401);
    }

    const keyRecord = await ApiKeyModel.findOne({ key, status: 'active' });

    if (!keyRecord) {
      throw new ApiError('INVALID_API_KEY', 'Invalid or revoked API key', 401);
    }

    await ApiKeyModel.updateOne({ _id: keyRecord._id }, { lastUsedAt: new Date() });

    return {
      valid: true,
      userId: keyRecord.userId,
      organizationId: keyRecord.organizationId,
      keyName: keyRecord.name,
    };
  },
};
