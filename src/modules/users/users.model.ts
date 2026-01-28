import { Schema, model, Model } from 'mongoose';
import { DEFAULT_TOKENS_LIMIT } from '../usage/usage.types';
import type { User } from './users.types';

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  image: { type: String },

  oderId: { type: String, unique: true, sparse: true },
  
  webhookUrl: { type: String },
  
  tokens: {
    limit: { type: Number, default: DEFAULT_TOKENS_LIMIT },
    used: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const UserModel: Model<User> = model<User>('User', userSchema);