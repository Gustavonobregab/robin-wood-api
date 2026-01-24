import {
  AUDIO_PRESETS,
  AUDIO_OPERATIONS,
  type StealAudioInput,
  type AudioPreset,
} from './audio.model';
import { ApiError } from '../../lib/api-error';

export class AudioService {
  //TODO: RETURN PROPER TYPE ON PROMISE
  async stealAudio(userId: string, input: StealAudioInput): Promise<string> {
    const { preset, operations: customOps } = input;

    if (!preset && !customOps) {
      throw new ApiError(
        'AUDIO_INVALID_INPUT',
        'Either preset or operations must be provided',
        400,
      );
    }

    const operations = preset
      ? AUDIO_PRESETS[preset as AudioPreset].operations
      : customOps!;

    return "Mock" + operations;
  }

  listPresets() {
    return Object.entries(AUDIO_PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      description: preset.description,
      operations: preset.operations.map(op => op.type),
    }));
  }

  listOperations() {
    return Object.entries(AUDIO_OPERATIONS).map(([id, op]) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }
}

export const audioService = new AudioService();
