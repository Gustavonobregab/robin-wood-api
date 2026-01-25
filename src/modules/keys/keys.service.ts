import { ApiKeyModel, type ApiKey } from './keys.model';
import { ApiError } from '../../utils/api-error';

export class KeysService {
  async createKey(userId: string, name: string): Promise<ApiKey> {
    // TODO: Implement key creation
    throw new Error('Not implemented');
  }

  async getKeysByUserId(userId: string): Promise<ApiKey[]> {
    // TODO: Implement get keys
    return [];
  }

  async revokeKey(keyId: string): Promise<void> {
    // TODO: Implement key revocation
  }

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
      keyName: keyRecord.name,
    };
  }
}

export const keysService = new KeysService();
