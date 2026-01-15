import { ApiKeyModel } from '../keys/keys.model';

export const authService = {
  async validateApiKey(key: string) {
    
    if (!key) {
      return { valid: false, error: 'API key is required' };
    }

    const keyRecord = await ApiKeyModel.findOne({ key, status: 'active' });

    if (!keyRecord) {
      return { valid: false, error: 'Invalid or revoked API key' };
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
