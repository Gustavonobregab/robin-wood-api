import { ImageModel, type Image, type CreateImageInput, type UpdateImageInput } from './image.model';
import { ApiError } from '../../lib/api-error';

export class ImageService {
  async create(userId: string, input: CreateImageInput): Promise<Image> {
    const image = await ImageModel.create({
      userId,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return image;
  }

  async getById(userId: string, id: string): Promise<Image> {
    const image = await ImageModel.findOne({ _id: id, userId });
    if (!image) {
      throw new ApiError('IMAGE_NOT_FOUND', 'Image not found', 404);
    }
    return image;
  }

  async list(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: Image[]; total: number; hasMore: boolean }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [items, total] = await Promise.all([
      ImageModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit + 1),
      ImageModel.countDocuments({ userId }),
    ]);

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return { items, total, hasMore };
  }

  async update(userId: string, id: string, input: UpdateImageInput): Promise<Image> {
    const image = await ImageModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...input, updatedAt: new Date() } },
      { new: true }
    );
    if (!image) {
      throw new ApiError('IMAGE_NOT_FOUND', 'Image not found', 404);
    }
    return image;
  }

  async delete(userId: string, id: string): Promise<{ deleted: boolean }> {
    const result = await ImageModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new ApiError('IMAGE_NOT_FOUND', 'Image not found', 404);
    }
    return { deleted: true };
  }
}

export const imageService = new ImageService();
