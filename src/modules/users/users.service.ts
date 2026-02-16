import { UserModel } from './users.model';
import { ApiError } from '../../utils/api-error';
import { usageService } from '../usage/usage.service';

export class UsersService {
  async getProfile(userId: string) {
    const user = await UserModel.findOne({
      $or: [{ oderId: userId }, { _id: userId }],
    }).lean();

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    const stats = await usageService.getUserStats(userId);

    return {
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      totalRequests: stats.totalRequests,
      tokensUsed: user.tokens?.used,
      tokensLimit: user.tokens?.limit,
    };
  }

  async updateProfile(userId: string, data: { name: string }) {
    const user = await UserModel.findOneAndUpdate(
      { $or: [{ oderId: userId }, { _id: userId }] },
      { $set: { name: data.name } },
      { new: true },
    );

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user;
  }

  async updateWebhookUrl(userId: string, url: string) {
    const user = await UserModel.findOneAndUpdate(
      { $or: [{ oderId: userId }, { _id: userId }] },
      { $set: { webhookUrl: url } },
      { new: true },
    );

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }
    return { webhookUrl: user.webhookUrl! };
  }
}

export const usersService = new UsersService();
