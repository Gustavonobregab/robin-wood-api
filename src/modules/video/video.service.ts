import { VideoModel, type Video, type CreateVideoInput, type UpdateVideoInput } from './video.model';
import { ApiError } from '../../lib/api-error';

export class VideoService {
  async create(userId: string, input: CreateVideoInput): Promise<Video> {
    const video = await VideoModel.create({
      userId,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return video;
  }

  async getById(userId: string, id: string): Promise<Video> {
    const video = await VideoModel.findOne({ _id: id, userId });
    if (!video) {
      throw new ApiError('VIDEO_NOT_FOUND', 'Video not found', 404);
    }
    return video;
  }

  async list(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: Video[]; total: number; hasMore: boolean }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [items, total] = await Promise.all([
      VideoModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit + 1),
      VideoModel.countDocuments({ userId }),
    ]);

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return { items, total, hasMore };
  }

  async update(userId: string, id: string, input: UpdateVideoInput): Promise<Video> {
    const video = await VideoModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...input, updatedAt: new Date() } },
      { new: true }
    );
    if (!video) {
      throw new ApiError('VIDEO_NOT_FOUND', 'Video not found', 404);
    }
    return video;
  }

  async delete(userId: string, id: string): Promise<{ deleted: boolean }> {
    const result = await VideoModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new ApiError('VIDEO_NOT_FOUND', 'Video not found', 404);
    }
    return { deleted: true };
  }
}

export const videoService = new VideoService();
