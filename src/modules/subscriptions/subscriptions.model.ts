import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface Plan {
  _id: ObjectId;
  slug: 'free' | 'pro' | 'enterprise';
  name: string;
  operationsPerMonth: number; // -1 = ilimitado
  priceMonthly: number; // centavos
  active: boolean;
}

export interface Subscription {
  _id: ObjectId;
  userId: string;
  planSlug: string; // 'free', 'pro', etc
  status: 'active' | 'canceled';
  operationsLimit: number;
  operationsUsed: number;
  resetAt: Date; // Próximo reset
  stripeSubscriptionId?: string;
  createdAt: Date;
}

const planSchema = new Schema<Plan>({
  slug: { type: String, enum: ['free', 'pro', 'enterprise'], required: true, unique: true },
  name: { type: String, required: true },
  operationsPerMonth: { type: Number, required: true },
  priceMonthly: { type: Number, required: true },
  active: { type: Boolean, default: true },
});

const subscriptionSchema = new Schema<Subscription>({
  userId: { type: String, required: true, unique: true, index: true },
  planSlug: { type: String, required: true },
  status: { type: String, enum: ['active', 'canceled'], default: 'active' },
  operationsLimit: { type: Number, required: true },
  operationsUsed: { type: Number, default: 0 },
  resetAt: { type: Date, required: true },
  stripeSubscriptionId: String,
  createdAt: { type: Date, default: Date.now },
});

// Indexes
subscriptionSchema.index({ userId: 1 }, { unique: true });

export const PlanModel: Model<Plan> = model<Plan>('Plan', planSchema);
export const SubscriptionModel: Model<Subscription> = model<Subscription>('Subscription', subscriptionSchema);
