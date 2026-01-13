import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface ApiKey {
  _id: ObjectId;
  userId: string; // ID do Better Auth
  key: string; // "sk_live_abc123..."
  name: string; // "Production", "Development"
  status: 'active' | 'revoked';
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date; // null = never
}

const apiKeySchema = new Schema<ApiKey>({
  userId: { type: String, required: true, index: true },
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: Date,
  expiresAt: Date,
});

// Indexes
apiKeySchema.index({ key: 1 }, { unique: true });
apiKeySchema.index({ userId: 1 });

export const ApiKeyModel: Model<ApiKey> = model<ApiKey>('ApiKey', apiKeySchema);
