import { Schema, model, Model } from 'mongoose';
import type { UsageEvent } from './usage.types';

const usageEventSchema = new Schema<UsageEvent>({
  idempotencyKey: { type: String, required: true, unique: true },

  userId: { type: String, required: true, index: true },
  apiKeyId: { type: String },
  source: { type: String, enum: ['api', 'dashboard'], required: true },

  pipelineType: { type: String, enum: ['audio', 'text', 'image', 'video'], required: true },
  operations: { type: [String], required: true },
  preset: { type: String },

  inputBytes: { type: Number, required: true },
  outputBytes: { type: Number, required: true },
  tokensSaved: { type: Number, required: true },

  processingMs: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

usageEventSchema.index({ userId: 1, timestamp: -1 });
usageEventSchema.index({ apiKeyId: 1, timestamp: -1 });

export const UsageEventModel: Model<UsageEvent> = model<UsageEvent>('UsageEvent', usageEventSchema);
