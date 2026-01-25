import {
  UsageEventModel,
  UsageMonthlyModel,
  type UsageEvent,
  type UsageMonthly,
  type PipelineMonthlyStats,
  type UsageEventInput,
  type RecordBatchResult,
  type CurrentUsageResult,
  type UsageLimitsResult,
} from './usage.model';
import { ApiKeyModel } from '../keys/keys.model';
import { PricingModel } from '../billing/billing.model';
import { SubscriptionModel } from '../subscriptions/subscriptions.model';
import { ApiError } from '../../utils/api-error';

interface AggregateUpdates {
  totalOperations: number;
  totalBytesSaved: number;
  totalCostUsd: number;
  freeTierOperationsUsed: number;
  pipelines: {
    audio: PipelineMonthlyStats;
    image: PipelineMonthlyStats;
    text: PipelineMonthlyStats;
    video: PipelineMonthlyStats;
  };
}

const DEFAULT_FREE_TIER_LIMIT = 1000;

function getCurrentPeriod(): { year: number; month: number; period: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const period = `${year}-${String(month).padStart(2, '0')}`;
  return { year, month, period };
}

function createEmptyPipelineStats(): PipelineMonthlyStats {
  return { operations: 0, bytesSaved: 0, costUsd: 0, freeTierUsed: 0 };
}

export class UsageService {
  async getOrCreateMonthlyUsage(
    userId: string,
    year: number,
    month: number
  ): Promise<UsageMonthly> {
    const period = `${year}-${String(month).padStart(2, '0')}`;

    const result = await UsageMonthlyModel.findOneAndUpdate(
      { userId, year, month },
      {
        $setOnInsert: {
          userId,
          year,
          month,
          period,
          totalOperations: 0,
          totalBytesSaved: 0,
          totalCostUsd: 0,
          audio: createEmptyPipelineStats(),
          image: createEmptyPipelineStats(),
          text: createEmptyPipelineStats(),
          video: createEmptyPipelineStats(),
          freeTierOperationsUsed: 0,
          freeTierOperationsLimit: DEFAULT_FREE_TIER_LIMIT,
          billable: false,
          invoiced: false,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return result;
  }

  async calculateEventCost(
    pipelineType: string,
    bytesSaved: number
  ): Promise<{ costUsd: number; pricePerGb: number }> {
    const pricing = await PricingModel.findOne({
      pipelineType,
      active: true,
      effectiveUntil: null,
    }).sort({ effectiveFrom: -1 });

    if (!pricing) {
      return { costUsd: 0, pricePerGb: 0 };
    }

    const gbSaved = bytesSaved / (1024 * 1024 * 1024);
    const costUsd = gbSaved * pricing.pricePerGbSaved;

    return { costUsd, pricePerGb: pricing.pricePerGbSaved };
  }

  async updateMonthlyAggregates(
    userId: string,
    year: number,
    month: number,
    updates: AggregateUpdates
  ): Promise<void> {
    const period = `${year}-${String(month).padStart(2, '0')}`;

    const updateQuery = {
      $inc: {
        totalOperations: updates.totalOperations,
        totalBytesSaved: updates.totalBytesSaved,
        totalCostUsd: updates.totalCostUsd,
        freeTierOperationsUsed: updates.freeTierOperationsUsed,
        'audio.operations': updates.pipelines.audio.operations,
        'audio.bytesSaved': updates.pipelines.audio.bytesSaved,
        'audio.costUsd': updates.pipelines.audio.costUsd,
        'audio.freeTierUsed': updates.pipelines.audio.freeTierUsed,
        'image.operations': updates.pipelines.image.operations,
        'image.bytesSaved': updates.pipelines.image.bytesSaved,
        'image.costUsd': updates.pipelines.image.costUsd,
        'image.freeTierUsed': updates.pipelines.image.freeTierUsed,
        'text.operations': updates.pipelines.text.operations,
        'text.bytesSaved': updates.pipelines.text.bytesSaved,
        'text.costUsd': updates.pipelines.text.costUsd,
        'text.freeTierUsed': updates.pipelines.text.freeTierUsed,
        'video.operations': updates.pipelines.video.operations,
        'video.bytesSaved': updates.pipelines.video.bytesSaved,
        'video.costUsd': updates.pipelines.video.costUsd,
        'video.freeTierUsed': updates.pipelines.video.freeTierUsed,
      },
      $set: {
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId,
        year,
        month,
        period,
        freeTierOperationsLimit: DEFAULT_FREE_TIER_LIMIT,
        billable: false,
        invoiced: false,
      },
    };

    const result = await UsageMonthlyModel.findOneAndUpdate(
      { userId, year, month },
      updateQuery,
      { upsert: true, new: true }
    );

    if (result && result.freeTierOperationsUsed >= result.freeTierOperationsLimit && !result.billable) {
      await UsageMonthlyModel.updateOne(
        { _id: result._id },
        { $set: { billable: true } }
      );
    }
  }

  async recordBatch(
    events: UsageEventInput[],
    apiKey: string,
    userId: string
  ): Promise<RecordBatchResult> {
    const keyRecord = await ApiKeyModel.findOne({ key: apiKey });
    if (!keyRecord) {
      throw new ApiError('API_KEY_NOT_FOUND', 'API key not found', 404);
    }

    const { year, month, period } = getCurrentPeriod();

    const monthlyUsage = await this.getOrCreateMonthlyUsage(userId, year, month);

    const freeTierLimit = monthlyUsage.freeTierOperationsLimit;
    const freeTierUsedBefore = monthlyUsage.freeTierOperationsUsed;
    let freeTierRemaining = Math.max(0, freeTierLimit - freeTierUsedBefore);

    const processedEvents: Partial<UsageEvent>[] = [];
    const aggregateUpdates: AggregateUpdates = {
      totalOperations: 0,
      totalBytesSaved: 0,
      totalCostUsd: 0,
      freeTierOperationsUsed: 0,
      pipelines: {
        audio: createEmptyPipelineStats(),
        image: createEmptyPipelineStats(),
        text: createEmptyPipelineStats(),
        video: createEmptyPipelineStats(),
      },
    };

    for (const event of events) {
      const isFreeTier = freeTierRemaining > 0;

      let costUsd = 0;
      let billableBytes = 0;

      if (!isFreeTier) {
        const { costUsd: calculatedCost } = await this.calculateEventCost(
          event.pipelineType,
          event.bytesSaved
        );
        costUsd = calculatedCost;
        billableBytes = event.bytesSaved;
      }

      const now = new Date();
      processedEvents.push({
        userId,
        apiKeyId: keyRecord._id,
        pipelineType: event.pipelineType,
        operations: event.operations,
        inputSizeBytes: event.inputSizeBytes,
        outputSizeBytes: event.outputSizeBytes,
        bytesSaved: event.bytesSaved,
        compressionRatio: event.compressionRatio,
        durationMs: event.durationMs,
        timestamp: event.timestamp ? new Date(event.timestamp) : now,
        clientVersion: event.clientVersion,
        environment: event.environment,
        billableBytes,
        costUsd,
        billedInPeriod: period,
      });

      aggregateUpdates.totalOperations += 1;
      aggregateUpdates.totalBytesSaved += event.bytesSaved;
      aggregateUpdates.totalCostUsd += costUsd;

      const pipelineKey = event.pipelineType;
      aggregateUpdates.pipelines[pipelineKey].operations += 1;
      aggregateUpdates.pipelines[pipelineKey].bytesSaved += event.bytesSaved;
      aggregateUpdates.pipelines[pipelineKey].costUsd += costUsd;

      if (isFreeTier) {
        aggregateUpdates.freeTierOperationsUsed += 1;
        aggregateUpdates.pipelines[pipelineKey].freeTierUsed += 1;
        freeTierRemaining -= 1;
      }
    }

    await UsageEventModel.insertMany(processedEvents);

    await this.updateMonthlyAggregates(userId, year, month, aggregateUpdates);

    const newFreeTierRemaining = Math.max(
      0,
      freeTierLimit - freeTierUsedBefore - aggregateUpdates.freeTierOperationsUsed
    );
    const isBillable = newFreeTierRemaining === 0;

    return {
      recorded: processedEvents.length,
      period,
      freeTierRemaining: newFreeTierRemaining,
      billable: isBillable,
    };
  }

  async getCurrentUsage(userId: string): Promise<CurrentUsageResult> {
    const { year, month, period } = getCurrentPeriod();

    const monthlyUsage = await UsageMonthlyModel.findOne({ userId, year, month });

    if (!monthlyUsage) {
      return {
        period,
        totalOperations: 0,
        totalBytesSaved: 0,
        totalCostUsd: 0,
        pipelines: {
          audio: createEmptyPipelineStats(),
          image: createEmptyPipelineStats(),
          text: createEmptyPipelineStats(),
          video: createEmptyPipelineStats(),
        },
        freeTier: {
          operationsUsed: 0,
          operationsLimit: DEFAULT_FREE_TIER_LIMIT,
          operationsRemaining: DEFAULT_FREE_TIER_LIMIT,
          percentUsed: 0,
        },
        billable: false,
      };
    }

    const operationsRemaining = Math.max(
      0,
      monthlyUsage.freeTierOperationsLimit - monthlyUsage.freeTierOperationsUsed
    );
    const percentUsed = Math.min(
      100,
      (monthlyUsage.freeTierOperationsUsed / monthlyUsage.freeTierOperationsLimit) * 100
    );

    return {
      period: monthlyUsage.period,
      totalOperations: monthlyUsage.totalOperations,
      totalBytesSaved: monthlyUsage.totalBytesSaved,
      totalCostUsd: monthlyUsage.totalCostUsd,
      pipelines: {
        audio: monthlyUsage.audio,
        image: monthlyUsage.image,
        text: monthlyUsage.text,
        video: monthlyUsage.video,
      },
      freeTier: {
        operationsUsed: monthlyUsage.freeTierOperationsUsed,
        operationsLimit: monthlyUsage.freeTierOperationsLimit,
        operationsRemaining,
        percentUsed,
      },
      billable: monthlyUsage.billable,
    };
  }

  async getUsageHistory(
    userId: string,
    options?: { startPeriod?: string; endPeriod?: string; limit?: number }
  ): Promise<{ history: UsageMonthly[]; total: number; hasMore: boolean }> {
    const limit = options?.limit || 12;

    const query: Record<string, unknown> = { userId };

    if (options?.startPeriod || options?.endPeriod) {
      query.period = {};
      if (options.startPeriod) {
        (query.period as Record<string, string>).$gte = options.startPeriod;
      }
      if (options.endPeriod) {
        (query.period as Record<string, string>).$lte = options.endPeriod;
      }
    }

    const [history, total] = await Promise.all([
      UsageMonthlyModel.find(query)
        .sort({ year: -1, month: -1 })
        .limit(limit + 1),
      UsageMonthlyModel.countDocuments(query),
    ]);

    const hasMore = history.length > limit;
    if (hasMore) {
      history.pop();
    }

    return { history, total, hasMore };
  }

  async getUserLimits(userId: string): Promise<UsageLimitsResult> {
    const { year, month } = getCurrentPeriod();

    const [subscription, monthlyUsage, pricingList] = await Promise.all([
      SubscriptionModel.findOne({ userId }),
      UsageMonthlyModel.findOne({ userId, year, month }),
      PricingModel.find({ active: true, effectiveUntil: null }),
    ]);

    const freeTierUsed = monthlyUsage?.freeTierOperationsUsed || 0;
    const freeTierLimit = monthlyUsage?.freeTierOperationsLimit || DEFAULT_FREE_TIER_LIMIT;

    const planSlug = subscription?.planSlug || 'free';
    const planOperationsLimit = subscription?.operationsLimit || 0;
    const planOperationsUsed = subscription?.operationsUsed || 0;

    const pricing: Record<string, { pricePerGbSaved: number }> = {};
    for (const p of pricingList) {
      pricing[p.pipelineType] = { pricePerGbSaved: p.pricePerGbSaved };
    }

    return {
      plan: planSlug,
      freeTier: {
        operationsLimit: freeTierLimit,
        operationsUsed: freeTierUsed,
        operationsRemaining: Math.max(0, freeTierLimit - freeTierUsed),
      },
      planLimits: {
        operationsLimit: planOperationsLimit,
        operationsUsed: planOperationsUsed,
        operationsRemaining:
          planOperationsLimit === -1
            ? 'unlimited'
            : Math.max(0, planOperationsLimit - planOperationsUsed),
      },
      pricing,
    };
  }
}

export const usageService = new UsageService();
