import { TextModel, type Text, type CreateTextInput, type UpdateTextInput } from './text.model';
import { ApiError } from '../../lib/api-error';

export class TextService {
  async create(userId: string, input: CreateTextInput): Promise<Text> {
    const text = await TextModel.create({
      userId,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return text;
  }

  async getById(userId: string, id: string): Promise<Text> {
    const text = await TextModel.findOne({ _id: id, userId });
    if (!text) {
      throw new ApiError('TEXT_NOT_FOUND', 'Text not found', 404);
    }
    return text;
  }

  async list(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: Text[]; total: number; hasMore: boolean }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [items, total] = await Promise.all([
      TextModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit + 1),
      TextModel.countDocuments({ userId }),
    ]);

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return { items, total, hasMore };
  }

  async update(userId: string, id: string, input: UpdateTextInput): Promise<Text> {
    const text = await TextModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...input, updatedAt: new Date() } },
      { new: true }
    );
    if (!text) {
      throw new ApiError('TEXT_NOT_FOUND', 'Text not found', 404);
    }
    return text;
  }

  async delete(userId: string, id: string): Promise<{ deleted: boolean }> {
    const result = await TextModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new ApiError('TEXT_NOT_FOUND', 'Text not found', 404);
    }
    return { deleted: true };
  }
}

export const textService = new TextService();
