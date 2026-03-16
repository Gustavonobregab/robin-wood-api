import type { ObjectId } from 'mongoose';

export interface ApiKey {
  _id: ObjectId;
  userId: string; // Better Auth ID
  key: string; // "sk_live_abc123..."
  name: string; // "Production", "Development"
  status: 'active' | 'revoked';
  revokedAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}
