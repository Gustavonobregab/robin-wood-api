import { UserModel, type User } from './users.model';
import { ApiError } from '../../utils/api-error';

const DEFAULT_FREE_TIER_LIMIT = 1000;

function getNextResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

export class UsersService {
  async getOrCreateUser(oderId: string, email: string): Promise<User> {
    const existingUser = await UserModel.findOne({ oderId });

    if (existingUser) {
      // Check if free tier needs reset
      if (existingUser.freeTier.resetsAt <= new Date()) {
        await this.resetFreeTier(oderId);
        return (await UserModel.findOne({ oderId }))!;
      }
      return existingUser;
    }

    const newUser = await UserModel.create({
      oderId,
      email,
      webhookUrl: undefined, // Começa vazio
      freeTier: {
        operationsLimit: DEFAULT_FREE_TIER_LIMIT,
        operationsUsed: 0,
        resetsAt: getNextResetDate(),
      },
    });

    return newUser;
  }

  async getUserByOderId(oderId: string): Promise<User | null> {
    return UserModel.findOne({ oderId });
  }

  async incrementFreeTierUsage(oderId: string, count: number = 1): Promise<User> {
    const user = await UserModel.findOneAndUpdate(
      { oderId },
      {
        $inc: { 'freeTier.operationsUsed': count },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user;
  }

  async resetFreeTier(oderId: string): Promise<User> {
    const user = await UserModel.findOneAndUpdate(
      { oderId },
      {
        $set: {
          'freeTier.operationsUsed': 0,
          'freeTier.resetsAt': getNextResetDate(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user;
  }

  async getFreeTierStatus(oderId: string): Promise<{
    operationsLimit: number;
    operationsUsed: number;
    operationsRemaining: number;
    resetsAt: Date;
    percentUsed: number;
  }> {
    const user = await UserModel.findOne({ oderId });

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Check if needs reset
    if (user.freeTier.resetsAt <= new Date()) {
      await this.resetFreeTier(oderId);
      const updatedUser = await UserModel.findOne({ oderId });
      if (!updatedUser) {
        throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
      }
      const { operationsLimit, operationsUsed, resetsAt } = updatedUser.freeTier;
      const operationsRemaining = Math.max(0, operationsLimit - operationsUsed);
      const percentUsed = Math.min(100, (operationsUsed / operationsLimit) * 100);
      return { operationsLimit, operationsUsed, operationsRemaining, resetsAt, percentUsed };
    }

    const { operationsLimit, operationsUsed, resetsAt } = user.freeTier;
    const operationsRemaining = Math.max(0, operationsLimit - operationsUsed);
    const percentUsed = Math.min(100, (operationsUsed / operationsLimit) * 100);

    return {
      operationsLimit,
      operationsUsed,
      operationsRemaining,
      resetsAt,
      percentUsed,
    };
  }

  // --- NOVO MÉTODO ---
  async updateWebhookUrl(oderId: string, url: string): Promise<{ message: string; webhookUrl: string }> {
    // 1. Validação simples de URL
    try {
      new URL(url);
    } catch (e) {
      throw new ApiError('INVALID_INPUT', 'Invalid URL format', 400);
    }

    // 2. Atualiza no Banco
    const user = await UserModel.findOneAndUpdate(
      { oderId },
      { 
        $set: { 
          webhookUrl: url,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Força a tipagem de retorno pois sabemos que webhookUrl agora existe
    return { 
      message: 'Webhook URL configured successfully', 
      webhookUrl: user.webhookUrl! 
    };
  }
}

export const usersService = new UsersService();