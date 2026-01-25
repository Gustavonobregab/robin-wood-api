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
