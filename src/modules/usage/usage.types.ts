import type { ObjectId } from 'mongoose';

export type PipelineType = 'audio' | 'text' | 'image' | 'video';
export type UsageSource = 'api' | 'dashboard';

// Tokens = bytes saved (input - output)
export interface UsageEvent {
  _id: ObjectId;
  idempotencyKey: string;

  userId: string;
  apiKeyId?: string;
  source: UsageSource;

  pipelineType: PipelineType;
  operations: string[];
  preset?: string;

  inputBytes: number;
  outputBytes: number;
  tokensSaved: number;

  processingMs: number;
  timestamp: Date;
}

export interface RecordUsageInput {
  idempotencyKey: string;
  userId: string;
  apiKeyId?: string;
  source: UsageSource;
  pipelineType: PipelineType;
  operations: string[];
  preset?: string;
  inputBytes: number;
  outputBytes: number;
  processingMs: number;
}

export interface RecordUsageResult {
  eventId: string;
  tokensSaved: number;
  tokensRemaining: number;
}

export interface UsageLimits {
  canProcess: boolean;
  reason?: string;
  tokensLimit: number;
  tokensUsed: number;
  tokensRemaining: number;
}

export interface CurrentUsage {
  tokensLimit: number;
  tokensUsed: number;
  tokensRemaining: number;
}

// Default free tier (500MB)
export const DEFAULT_TOKENS_LIMIT = 500_000_000;
