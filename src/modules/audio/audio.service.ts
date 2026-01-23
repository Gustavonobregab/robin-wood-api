import { AudioModel, type Audio, type CreateAudioInput, type UpdateAudioInput } from './audio.model';
import { ApiError } from '../../lib/api-error';

export class AudioService {
  async create(userId: string, input: CreateAudioInput): Promise<Audio> {
    const audio = await AudioModel.create({
      userId,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return audio;
  }

  async getById(userId: string, id: string): Promise<Audio> {
    const audio = await AudioModel.findOne({ _id: id, userId });
    if (!audio) {
      throw new ApiError('AUDIO_NOT_FOUND', 'Audio not found', 404);
    }
    return audio;
  }

  async list(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: Audio[]; total: number; hasMore: boolean }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [items, total] = await Promise.all([
      AudioModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit + 1),
      AudioModel.countDocuments({ userId }),
    ]);

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return { items, total, hasMore };
  }

  async update(userId: string, id: string, input: UpdateAudioInput): Promise<Audio> {
    const audio = await AudioModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...input, updatedAt: new Date() } },
      { new: true }
    );
    if (!audio) {
      throw new ApiError('AUDIO_NOT_FOUND', 'Audio not found', 404);
    }
    return audio;
  }

  async delete(userId: string, id: string): Promise<{ deleted: boolean }> {
    const result = await AudioModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new ApiError('AUDIO_NOT_FOUND', 'Audio not found', 404);
    }
    return { deleted: true };
  }
}

export const audioService = new AudioService();
