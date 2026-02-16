import {
  TEXT_PRESETS,
  TEXT_OPERATIONS,
  type ProcessTextInput,
  type TextPreset,
  type TextOperation,
} from './text.types';
import { ApiError } from '../../utils/api-error';
import type { Job } from '../jobs/job.types';

export class TextService {

  async processText(
    userId: string,
    input: ProcessTextInput
  ): Promise<{ job: Job }> {
    const { preset, operations: customOps, textUrl } = input;

    if (!preset && (!customOps || customOps.length === 0)) {
      throw new ApiError(
        'TEXT_INVALID_INPUT',
        'Either preset or operations must be provided',
        400
      );
    }

    const operations = this.resolveOperations(preset, customOps);

    //TODO: ENQUEUE JOB HERE
    const job = { id: '123', userId, status: 'pending', payload: { type: 'text', operations, textUrl }, createdAt: new Date() } as unknown as Job;
    return { job };
  }

  private resolveOperations(
    preset?: TextPreset,
    customOps?: TextOperation[]
  ): TextOperation[] {
    if (preset) {
      const presetConfig = TEXT_PRESETS[preset];

      if (!presetConfig) {
        throw new ApiError('TEXT_INVALID_PRESET', `Unknown preset: ${preset}`, 400);
      }
      return presetConfig.operations as unknown as TextOperation[];
    }

    return customOps!;
  }

  listPresets() {
    return Object.entries(TEXT_PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      description: preset.description,
      operations: preset.operations.map((op) => op.type),
    }));
  }

  listOperations() {
    return Object.entries(TEXT_OPERATIONS).map(([id, op]) => ({
      id,
      name: op.name,
      description: op.description,
      params: op.params,
    }));
  }
}

export const textService = new TextService();
