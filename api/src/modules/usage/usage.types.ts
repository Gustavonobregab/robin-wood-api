import type { ObjectId } from 'mongoose';

export type PipelineType = 'audio' | 'text' | 'image' | 'video';

// Tokens = bytes saved (input - output)
export interface UsageEvent {
  _id: ObjectId;
  idempotencyKey: string;

  userId: string;
  apiKeyId?: string;

  pipelineType: PipelineType;
  operations: string[];

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
  pipelineType: PipelineType;
  operations: string[];
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

// --- NOVOS TIPOS PARA ANALÍTICA (DASHBOARD) ---

export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface UsageAnalytics {
  stats: {
    totalRequests: number;
    tokensSaved: number;
    tokensUsed: number;
  };
  chart: {
    date: string; // Formato "DD/MM"
    requests: number;
  }[];
  breakdown: {
    type: string; // 'Text', 'Audio', etc.
    count: number;
    percentage: number;
  }[];
  recent: {
    id: string;
    type: string;
    status: string; // 'success' | 'error'
    size: string;   // Ex: "2KB -> 1KB"
    latency: string; // Ex: "120ms"
    timestamp: string; // Data formatada
  }[];
}