import { Schema, model, Model } from 'mongoose';
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

const apiKeySchema = new Schema<ApiKey>({
  userId: { type: String, required: true },
  key: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  revokedAt: Date,
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: Date,
});

apiKeySchema.index({ key: 1 }, { unique: true });
apiKeySchema.index({ userId: 1 });

export const ApiKeyModel: Model<ApiKey> = model<ApiKey>('ApiKey', apiKeySchema);
