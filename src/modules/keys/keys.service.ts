import { ApiKeyModel, type ApiKey } from './keys.model';

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
}
