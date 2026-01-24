import {
  TEXT_PRESETS,
  TEXT_OPERATIONS,
  type StealTextInput,
  type TextPreset,
} from './text.model';
import { ApiError } from '../../lib/api-error';

export class TextService {
  async stealText(userId: string, input: StealTextInput): Promise<string> {
    const { preset, operations: customOps } = input;

    if (!preset && !customOps) {
      throw new ApiError(
        'TEXT_INVALID_INPUT',
        'Either preset or operations must be provided',
        400,
      );
    }

    const operations = preset
      ? TEXT_PRESETS[preset as TextPreset].operations
      : customOps!;

    return "Mock" + operations;
  }

  listPresets() {
    return Object.entries(TEXT_PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      description: preset.description,
      operations: preset.operations.map(op => op.type),
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
