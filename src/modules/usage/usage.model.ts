import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface UsageEvent {
  _id: ObjectId;
  userId: string;
  apiKeyId: ObjectId;
  pipelineType: 'audio' | 'image' | 'text';
  operations: string[]; // ['compress', 'normalize']
  inputSizeBytes: number;
  outputSizeBytes: number;
  bytesSaved: number;
  durationMs: number;
  timestamp: Date;
}

export interface UsageMonthly {
  _id: ObjectId;
  userId: string;
  year: number;
  month: number; // 1-12
  totalOperations: number;
  totalBytesSaved: number;
  audio: { operations: number; bytesSaved: number };
  image: { operations: number; bytesSaved: number };
  text: { operations: number; bytesSaved: number };
  updatedAt: Date;
}

const usageEventSchema = new Schema<UsageEvent>({
  userId: { type: String, required: true, index: true },
  apiKeyId: { type: Schema.Types.ObjectId, required: true, ref: 'ApiKey' },
  pipelineType: { type: String, enum: ['audio', 'image', 'text'], required: true },
  operations: { type: [String], required: true },
  inputSizeBytes: { type: Number, required: true },
  outputSizeBytes: { type: Number, required: true },
  bytesSaved: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

const usageMonthlySchema = new Schema<UsageMonthly>({
  userId: { type: String, required: true, index: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  totalOperations: { type: Number, default: 0 },
  totalBytesSaved: { type: Number, default: 0 },
  audio: {
    operations: { type: Number, default: 0 },
    bytesSaved: { type: Number, default: 0 },
  },
  image: {
    operations: { type: Number, default: 0 },
    bytesSaved: { type: Number, default: 0 },
  },
  text: {
    operations: { type: Number, default: 0 },
    bytesSaved: { type: Number, default: 0 },
  },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
usageEventSchema.index({ userId: 1, timestamp: -1 });
usageEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

usageMonthlySchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const UsageEventModel: Model<UsageEvent> = model<UsageEvent>('UsageEvent', usageEventSchema);
export const UsageMonthlyModel: Model<UsageMonthly> = model<UsageMonthly>('UsageMonthly', usageMonthlySchema);
