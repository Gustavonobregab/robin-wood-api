import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface UsageEvent {
  _id: ObjectId;
  userId: string;
  apiKeyId: ObjectId;
  pipelineType: 'audio' | 'image' | 'text' | 'video';
  operations: string[]; // ['compress', 'normalize']
  inputSizeBytes: number;
  outputSizeBytes: number;
  bytesSaved: number; // Main metric for billing
  compressionRatio: number;
  durationMs: number;
  timestamp: Date;
  clientVersion?: string;
  environment?: string; // 'production', 'development'
  billableBytes: number; // bytesSaved if > free tier
  costUsd: number; // Calculated based on price per GB of pipeline
  billedInPeriod: string; // "2026-01" (year-month)
}

export interface PipelineMonthlyStats {
  operations: number;
  bytesSaved: number;
  costUsd: number; // Specific cost for this pipeline
  freeTierUsed: number; // Number of operations used from free tier
}

export interface UsageMonthly {
  _id: ObjectId;
  userId: string;
  year: number;
  month: number; // 1-12
  period: string; // "2026-01" (year-month format for easier queries)
  totalOperations: number;
  totalBytesSaved: number;
  totalCostUsd: number; // Sum of all costs
  audio: PipelineMonthlyStats;
  image: PipelineMonthlyStats;
  text: PipelineMonthlyStats;
  video: PipelineMonthlyStats;
  freeTierOperationsUsed: number; // Number of operations used from free tier
  freeTierOperationsLimit: number; // Free tier limit (e.g., 1000)
  billable: boolean; // If exceeded free tier
  invoiced: boolean; // If invoice was already generated
  invoiceId?: ObjectId; // Reference to Invoice
  updatedAt: Date;
}

// Service input/output types
export type PipelineType = 'audio' | 'image' | 'text' | 'video';

export interface UsageEventInput {
  pipelineType: PipelineType;
  operations: string[];
  inputSizeBytes: number;
  outputSizeBytes: number;
  bytesSaved: number;
  compressionRatio: number;
  durationMs: number;
  timestamp?: string;
  clientVersion?: string;
  environment?: string;
}

export interface RecordBatchResult {
  recorded: number;
  period: string;
  freeTierRemaining: number;
  billable: boolean;
}

export interface CurrentUsageResult {
  period: string;
  totalOperations: number;
  totalBytesSaved: number;
  totalCostUsd: number;
  pipelines: {
    audio: PipelineMonthlyStats;
    image: PipelineMonthlyStats;
    text: PipelineMonthlyStats;
    video: PipelineMonthlyStats;
  };
  freeTier: {
    operationsUsed: number;
    operationsLimit: number;
    operationsRemaining: number;
    percentUsed: number;
  };
  billable: boolean;
}

export interface UsageLimitsResult {
  plan: string;
  freeTier: {
    operationsLimit: number;
    operationsUsed: number;
    operationsRemaining: number;
  };
  planLimits: {
    operationsLimit: number;
    operationsUsed: number;
    operationsRemaining: number | 'unlimited';
  };
  pricing: Record<string, { pricePerGbSaved: number }>;
}

const usageEventSchema = new Schema<UsageEvent>({
  userId: { type: String, required: true, index: true },
  apiKeyId: { type: Schema.Types.ObjectId, required: true, ref: 'ApiKey' },
  pipelineType: { type: String, enum: ['audio', 'image', 'text', 'video'], required: true },
  operations: { type: [String], required: true },
  inputSizeBytes: { type: Number, required: true },
  outputSizeBytes: { type: Number, required: true },
  bytesSaved: { type: Number, required: true },
  compressionRatio: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  clientVersion: String,
  environment: String,
  billableBytes: { type: Number, default: 0 },
  costUsd: { type: Number, default: 0 },
  billedInPeriod: { type: String, required: true, index: true },
});

const pipelineMonthlyStatsSchema = new Schema<PipelineMonthlyStats>({
  operations: { type: Number, default: 0 },
  bytesSaved: { type: Number, default: 0 },
  costUsd: { type: Number, default: 0 },
  freeTierUsed: { type: Number, default: 0 },
}, { _id: false });

const usageMonthlySchema = new Schema<UsageMonthly>({
  userId: { type: String, required: true, index: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  period: { type: String, required: true, index: true },
  totalOperations: { type: Number, default: 0 },
  totalBytesSaved: { type: Number, default: 0 },
  totalCostUsd: { type: Number, default: 0 },
  audio: { type: pipelineMonthlyStatsSchema, default: () => ({}) },
  image: { type: pipelineMonthlyStatsSchema, default: () => ({}) },
  text: { type: pipelineMonthlyStatsSchema, default: () => ({}) },
  video: { type: pipelineMonthlyStatsSchema, default: () => ({}) },
  freeTierOperationsUsed: { type: Number, default: 0 },
  freeTierOperationsLimit: { type: Number, default: 1000 },
  billable: { type: Boolean, default: false, index: true },
  invoiced: { type: Boolean, default: false, index: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  updatedAt: { type: Date, default: Date.now },
});

usageEventSchema.index({ userId: 1, timestamp: -1 });
usageEventSchema.index({ userId: 1, billedInPeriod: 1 });
usageEventSchema.index({ timestamp: 1 });
usageEventSchema.index({ apiKeyId: 1, timestamp: -1 });
usageMonthlySchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
usageMonthlySchema.index({ period: 1, invoiced: 1 });

export const UsageEventModel: Model<UsageEvent> = model<UsageEvent>('UsageEvent', usageEventSchema);
export const UsageMonthlyModel: Model<UsageMonthly> = model<UsageMonthly>('UsageMonthly', usageMonthlySchema);
