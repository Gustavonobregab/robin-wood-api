import { randomBytes } from 'crypto';
import { ApiKeyModel } from './keys.model';
import type { ApiKey } from './keys.types';
import { ApiError } from '../../utils/api-error';
import { UserModel } from '../users/users.model';
import { PlanModel } from '../plans/plans.model';

export class KeysService {
  private generateApiKey(): string {
    const prefix = 'sk_live_';
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
  }

  async createKey(userId: string, name: string): Promise<ApiKey> {
    const existingKeys = await ApiKeyModel.countDocuments({ userId, status: 'active' });

    // Get max keys from user's plan, fallback to 5
    let maxKeys = 5;
    const user = await UserModel.findOne({
      $or: [{ oderId: userId }, { _id: userId }],
    }).lean();

    if (user?.plan) {
      const plan = await PlanModel.findById(user.plan).lean();
      if (plan) {
        maxKeys = plan.features.maxApiKeys;
      }
    }

    if (existingKeys >= maxKeys) {
      throw new ApiError('KEY_LIMIT_REACHED', `Maximum of ${maxKeys} active API keys allowed on your plan`, 400);
    }

    const key = this.generateApiKey();

    const apiKey = await ApiKeyModel.create({
      userId,
      key,
      name,
      status: 'active',
      createdAt: new Date(),
    });

    return apiKey;
  }

  async getKeysByUserId(userId: string): Promise<ApiKey[]> {
    const keys = await ApiKeyModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return keys;
  }

  async revokeKey(userId: string, keyId: string): Promise<void> {
    const key = await ApiKeyModel.findOne({ _id: keyId, userId });

    if (!key) {
      throw new ApiError('KEY_NOT_FOUND', 'API key not found', 404);
    }

    if (key.status === 'revoked') {
      throw new ApiError('KEY_ALREADY_REVOKED', 'API key is already revoked', 400);
    }

    await ApiKeyModel.updateOne(
      { _id: keyId },
      { status: 'revoked', revokedAt: new Date() }
    );
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

  async getKeyById(userId: string, keyId: string): Promise<ApiKey | null> {
    const key = await ApiKeyModel.findOne({ _id: keyId, userId }).lean();
    return key;
  }
}

export const keysService = new KeysService();
