import { Schema, model, Model } from 'mongoose';
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

const webhookEventSchema = new Schema<WebhookEvent>({
  userId: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    enum: ['usage.threshold_reached', 'invoice.created', 'payment.failed'],
    required: true 
  },
  payload: { type: Schema.Types.Mixed, required: true },
  deliveredAt: Date,
  failedAt: Date,
  attempts: { type: Number, default: 0 },
  lastError: String,
  createdAt: { type: Date, default: Date.now },
});

webhookEventSchema.index({ userId: 1, createdAt: -1 });
webhookEventSchema.index({ eventType: 1, deliveredAt: 1 });

export const WebhookEventModel: Model<WebhookEvent> = model<WebhookEvent>('WebhookEvent', webhookEventSchema);
