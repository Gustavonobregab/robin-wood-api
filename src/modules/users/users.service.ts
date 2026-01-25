import { UserModel, type User } from './users.model';
import { ApiError } from '../../utils/api-error';
import { DEFAULT_TOKENS_LIMIT } from '../usage/usage.types';

export class UsersService {
  async getOrCreateUser(oderId: string, email: string): Promise<User> {
    const existingUser = await UserModel.findOne({ oderId });

    if (existingUser) {
      return existingUser;
    }

    return UserModel.create({
      oderId,
      email,
      tokens: {
        limit: DEFAULT_TOKENS_LIMIT,
        used: 0,
      },
    });
  }

  async getUserByOderId(oderId: string): Promise<User | null> {
    return UserModel.findOne({ oderId });
  }

  async updateWebhookUrl(oderId: string, url: string): Promise<{ message: string; webhookUrl: string }> {
    try {
      new URL(url);
    } catch {
      throw new ApiError('INVALID_INPUT', 'Invalid URL format', 400);
    }

    const user = await UserModel.findOneAndUpdate(
      { oderId },
      { $set: { webhookUrl: url, updatedAt: new Date() } },
      { new: true }
    );

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    return { message: 'Webhook URL configured successfully', webhookUrl: user.webhookUrl! };
  }
}

export const usersService = new UsersService();
