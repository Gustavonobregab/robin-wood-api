import { UsageEventModel } from './usage.model';
import { UserModel } from '../users/users.model';
import { ApiError } from '../../utils/api-error';
import type {
  RecordUsageInput,
  RecordUsageResult,
  UsageLimits,
  CurrentUsage,
} from './usage.types';

export class UsageService {
  async record(input: RecordUsageInput): Promise<RecordUsageResult> {
    const existingEvent = await UsageEventModel.findOne({
      idempotencyKey: input.idempotencyKey,
    });

    if (existingEvent) {
      const user = await UserModel.findOne({ oderId: input.userId });
      if (!user) {
        throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
      }
      return {
        eventId: existingEvent._id.toString(),
        tokensSaved: existingEvent.tokensSaved,
        tokensRemaining: user.tokens.limit - user.tokens.used,
      };
    }

    const tokensSaved = Math.max(0, input.inputBytes - input.outputBytes);

    const event = await UsageEventModel.create({
      idempotencyKey: input.idempotencyKey,
      userId: input.userId,
      apiKeyId: input.apiKeyId,
      source: input.source,
      pipelineType: input.pipelineType,
      operations: input.operations,
      preset: input.preset,
      inputBytes: input.inputBytes,
      outputBytes: input.outputBytes,
      tokensSaved,
      processingMs: input.processingMs,
      timestamp: new Date(),
    });

    const user = await UserModel.findOneAndUpdate(
      { oderId: input.userId },
      { $inc: { 'tokens.used': tokensSaved } },
      { new: true }
    );

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    const tokensRemaining = Math.max(0, user.tokens.limit - user.tokens.used);

    return {
      eventId: event._id.toString(),
      tokensSaved,
      tokensRemaining,
    };
  }

  async checkLimits(userId: string): Promise<UsageLimits> {
    const user = await UserModel.findOne({ oderId: userId });

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    const tokensRemaining = Math.max(0, user.tokens.limit - user.tokens.used);
    const canProcess = tokensRemaining > 0;

    return {
      canProcess,
      reason: canProcess ? undefined : 'Token limit exceeded',
      tokensLimit: user.tokens.limit,
      tokensUsed: user.tokens.used,
      tokensRemaining,
    };
  }

  async getCurrentUsage(userId: string): Promise<CurrentUsage> {
    const user = await UserModel.findOne({ oderId: userId });

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    return {
      tokensLimit: user.tokens.limit,
      tokensUsed: user.tokens.used,
      tokensRemaining: Math.max(0, user.tokens.limit - user.tokens.used),
    };
  }
}

export const usageService = new UsageService();
