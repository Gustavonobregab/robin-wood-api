import { UsageEventModel } from './usage.model';
import { UserModel } from '../users/users.model';
import { ApiError } from '../../utils/api-error';
import { subDays, format } from 'date-fns'; // 👈 Import necessário
import type {
  RecordUsageInput,
  RecordUsageResult,
  UsageLimits,
  CurrentUsage,
  TimeRange,     // 👈 Certifique-se que adicionou isso no usage.types.ts
  UsageAnalytics // 👈 Certifique-se que adicionou isso no usage.types.ts
} from './usage.types';

export class UsageService {
  
  // ... (Mantenha o método record existente igual) ...
  async record(input: RecordUsageInput): Promise<RecordUsageResult> {
    const existingEvent = await UsageEventModel.findOne({
      idempotencyKey: input.idempotencyKey,
    });

    if (existingEvent) {
      const user = await UserModel.findOne({ oderId: input.userId });
      if (!user) throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
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
      pipelineType: input.pipelineType,
      operations: input.operations,
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

    if (!user) throw new ApiError('USER_NOT_FOUND', 'User not found', 404);

    return {
      eventId: event._id.toString(),
      tokensSaved,
      tokensRemaining: Math.max(0, user.tokens.limit - user.tokens.used),
    };
  }

  // 👇 NOVO MÉTODO: Lógica de Analítica
  async getAnalytics(userId: string, range: TimeRange = '30d'): Promise<UsageAnalytics> {
    // 1. Calcular Data de Início
    const now = new Date();
    let startDate = subDays(now, 30);
    
    if (range === '7d') startDate = subDays(now, 7);
    if (range === '90d') startDate = subDays(now, 90);
    if (range === '1y') startDate = subDays(now, 365);

    // 2. Buscar Eventos no Range
    const events = await UsageEventModel.find({
      userId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 }).lean();

    // 3. Stats Gerais
    const totalRequests = events.length;
    const tokensSaved = events.reduce((acc, curr) => acc + (curr.tokensSaved || 0), 0);
    
    const user = await UserModel.findOne({ oderId: userId }).lean();
    const tokensUsed = user?.tokens?.used || 0;

    // 4. Breakdown (Porcentagem por Tipo)
    const typeCounts: Record<string, number> = {};
    events.forEach(e => {
      const type = e.pipelineType || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const breakdown = Object.entries(typeCounts).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: totalRequests > 0 ? Number(((count / totalRequests) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.count - a.count);

    // 5. Gráfico (Agrupado por Dia)
    const chartMap = new Map<string, number>();
    
    // Preenche dias vazios com 0
    let loopDate = new Date(startDate);
    while (loopDate <= now) {
      chartMap.set(format(loopDate, 'dd/MM'), 0);
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // Preenche com dados
    events.forEach(e => {
      const key = format(new Date(e.timestamp), 'dd/MM');
      if (chartMap.has(key)) {
        chartMap.set(key, (chartMap.get(key) || 0) + 1);
      }
    });

    const chart = Array.from(chartMap.entries()).map(([date, requests]) => ({
      date,
      requests
    }));

    // 6. Recentes (Últimos 5)
    const recent = events.slice(0, 5).map(e => ({
      id: e._id.toString(),
      type: e.pipelineType ? e.pipelineType.charAt(0).toUpperCase() + e.pipelineType.slice(1) : 'Unknown',
      status: 'success',
      size: `${this.formatBytes(e.inputBytes)} → ${this.formatBytes(e.outputBytes)}`,
      latency: `${e.processingMs}ms`,
      timestamp: new Date(e.timestamp).toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })
    }));

    return {
      stats: { totalRequests, tokensSaved, tokensUsed },
      chart,
      breakdown,
      recent
    };
  }

  // ... (Mantenha checkLimits e getCurrentUsage igual) ...

  async checkLimits(userId: string): Promise<UsageLimits> {
    const user = await UserModel.findOne({ oderId: userId });
    if (!user) throw new ApiError('USER_NOT_FOUND', 'User not found', 404);

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

  async getUserStats(userId: string) {
    const totalRequests = await UsageEventModel.countDocuments({ userId });
    return { totalRequests };
  }

  async getCurrentUsage(userId: string): Promise<CurrentUsage> {
    const user = await UserModel.findOne({ oderId: userId });
    if (!user) throw new ApiError('USER_NOT_FOUND', 'User not found', 404);

    return {
      tokensLimit: user.tokens.limit,
      tokensUsed: user.tokens.used,
      tokensRemaining: Math.max(0, user.tokens.limit - user.tokens.used),
    };
  }

  // Helper privado para formatar bytes
  private formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`;
  }
}

export const usageService = new UsageService();