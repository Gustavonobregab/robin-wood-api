import {
  AUDIO_PRESETS,
  type StealAudioInput,
  type AudioPreset,
  AUDIO_OPERATIONS,
  type AudioOperation,
} from './audio.types';
import { ApiError } from '../../utils/api-error';
import { jobService } from '../jobs/job.service';
import type { Job } from '../jobs/job.types';

export class AudioService {
  
  async createAudioJob(
    userId: string,
    input: StealAudioInput
  ): Promise<{ job: Job }> {
    const { preset, operations: customOps, file } = input;

    if (!file) {
      throw new ApiError('AUDIO_INVALID_INPUT', 'File is required', 400);
    }

    if (!preset && (!customOps || customOps.length === 0)) {
      throw new ApiError(
        'AUDIO_INVALID_INPUT',
        'Either preset or operations must be provided',
        400
      );
    }

    const operations = this.resolveOperations(preset, customOps);

    const arrayBuffer = await file.arrayBuffer();
    const inputSize = arrayBuffer.byteLength;
    const originalFilename = file.name;

    const job = await jobService.create({
      userId,
      payload: {
        type: 'audio',
        operations,
        originalFilename,
        inputSize,
      },
    });

    // TODO: Aqui será feito upload do arquivo para storage (S3, etc)
    // const inputUrl = await storageService.upload(userId, job.id, originalFilename, buffer);
    // Depois o worker baixa o arquivo e processa

    await jobService.enqueue(job);

    return { job };
  }

  private resolveOperations(
    preset?: string,
    customOps?: AudioOperation[]
  ): AudioOperation[] {
    if (preset) {
      const presetConfig = AUDIO_PRESETS[preset as AudioPreset];
      if (!presetConfig) {
        throw new ApiError('AUDIO_INVALID_PRESET', `Unknown preset: ${preset}`, 400);
      }
      return presetConfig.operations as unknown as AudioOperation[];
    }

    return customOps!;
  }

  listPresets() {
    return Object.entries(AUDIO_PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      description: preset.description,
      operations: preset.operations.map((op) => op.type),
    }));
  }

  listOperations() {
    return Object.entries(AUDIO_OPERATIONS).map(([id, op]: any) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }
}

export const audioService = new AudioService();
