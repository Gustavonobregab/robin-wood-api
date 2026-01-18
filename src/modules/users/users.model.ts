import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface User {
  _id: ObjectId;
  oderId: string; // Better Auth user ID (external reference)
  email: string;
  freeTier: {
    operationsLimit: number;
    operationsUsed: number;
    resetsAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>({
  oderId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  freeTier: {
    operationsLimit: { type: Number, default: 1000 },
    operationsUsed: { type: Number, default: 0 },
    resetsAt: { type: Date, required: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.index({ oderId: 1 }, { unique: true });
userSchema.index({ email: 1 });

export const UserModel: Model<User> = model<User>('User', userSchema);
