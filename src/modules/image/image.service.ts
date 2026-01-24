import {
  IMAGE_PRESETS,
  IMAGE_OPERATIONS,
  type StealImageInput,
  type ImagePreset,
} from './image.model';
import { ApiError } from '../../lib/api-error';

export class ImageService {
  async stealImage(userId: string, input: StealImageInput): Promise<string> {
    const { preset, operations: customOps } = input;

    if (!preset && !customOps) {
      throw new ApiError(
        'IMAGE_INVALID_INPUT',
        'Either preset or operations must be provided',
        400,
      );
    }

    const operations = preset
      ? IMAGE_PRESETS[preset as ImagePreset].operations
      : customOps!;

    return "Mock" + operations;
  }

  listPresets() {
    return Object.entries(IMAGE_PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      description: preset.description,
      operations: preset.operations.map(op => op.type),
    }));
  }

  listOperations() {
    return Object.entries(IMAGE_OPERATIONS).map(([id, op]) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }
}

export const imageService = new ImageService();
