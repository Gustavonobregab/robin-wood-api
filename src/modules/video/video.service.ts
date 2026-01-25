import {
  VIDEO_PRESETS,
  VIDEO_OPERATIONS,
  type StealVideoInput,
  type VideoPreset,
} from './video.model';
import { ApiError } from '../../utils/api-error';

export class VideoService {
  async stealVideo(userId: string, input: StealVideoInput): Promise<string> {
    const { preset, operations: customOps } = input;

    if (!preset && !customOps) {
      throw new ApiError(
        'VIDEO_INVALID_INPUT',
        'Either preset or operations must be provided',
        400,
      );
    }

    const operations = preset
      ? VIDEO_PRESETS[preset as VideoPreset].operations
      : customOps!;

    return "Mock" + operations;
  }

  listPresets() {
    return Object.entries(VIDEO_PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      description: preset.description,
      operations: preset.operations.map(op => op.type),
    }));
  }

  listOperations() {
    return Object.entries(VIDEO_OPERATIONS).map(([id, op]) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }
}

export const videoService = new VideoService();
