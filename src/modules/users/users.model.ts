import { Schema, model, Model } from 'mongoose';
import { DEFAULT_TOKENS_LIMIT } from '../usage/usage.types';
import type { User } from './users.types';

const userSchema = new Schema<User>({
  oderId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  webhookUrl: { type: String },
  tokens: {
    limit: { type: Number, default: DEFAULT_TOKENS_LIMIT },
    used: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.index({ oderId: 1 }, { unique: true });
userSchema.index({ email: 1 });

export const UserModel: Model<User> = model<User>('User', userSchema);
