import type { ObjectId } from 'mongoose';

export interface WebhookEvent {
  _id: ObjectId;
  userId: string;
  eventType: 'usage.threshold_reached' | 'invoice.created' | 'payment.failed';
  payload: Record<string, any>;
  deliveredAt?: Date;
  failedAt?: Date;
  attempts: number;
  lastError?: string;
  createdAt: Date;
}
