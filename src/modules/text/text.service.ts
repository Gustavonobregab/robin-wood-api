import {
  TEXT_PRESETS,
  TEXT_OPERATIONS,
  type StealTextInput,
  type TextPreset,
  type TextOperation
} from './text.types';
import { ApiError } from '../../utils/api-error';
import { TextPipeline, type TextResult } from './text.pipeline';
import { usageService } from '../usage/usage.service';
import { generateIdempotencyKey, hashInput } from '../../utils/idempotency';

export class TextService {
  async stealText(
    userId: string,
    input: StealTextInput,
    context?: { apiKeyId?: string }
  ): Promise<TextResult> {
    const startTime = Date.now();
    const { preset, operations: customOps, text } = input;

    if (!text || text.trim().length === 0) {
      throw new ApiError('TEXT_INVALID_INPUT', 'Text is required', 400);
    }

    const originalBytes = new TextEncoder().encode(text).length;

    if (!preset && (!customOps || customOps.length === 0)) {
      throw new ApiError(
        'TEXT_INVALID_INPUT',
        'Either preset or operations must be provided',
        400,
      );
    }

    const operationsToRun = (preset
      ? TEXT_PRESETS[preset as TextPreset].operations
      : customOps!) as TextOperation[];

    let pipeline = new TextPipeline(text);

    for (const op of operationsToRun) {
      pipeline = pipeline.apply(op);
    }

    const result = await pipeline.execute();
    const outputBytes = new TextEncoder().encode(result.data).length;

    const operationNames = operationsToRun.map(op => op.type);
    const inputHash = hashInput({
      userId,
      pipelineType: 'text',
      operations: operationNames,
      inputSize: originalBytes,
    });

    try {
      await usageService.record({
        idempotencyKey: generateIdempotencyKey(userId, 'text', inputHash),
        userId,
        apiKeyId: context?.apiKeyId,
        pipelineType: 'text',
        operations: operationNames,
        inputBytes: originalBytes,
        outputBytes,
        processingMs: Date.now() - startTime,
      });
    } catch (e) {
      console.error('Usage recording error:', e);
    }

    return result;
  }

  listPresets() {
    return Object.entries(TEXT_PRESETS).map(([id, val]) => {
      // Fazemos o cast (as ...) para dizer ao TS o formato do objeto
      const preset = val as {
        name: string;
        description: string;
        operations: { type: string }[]
      };

      return {
        id,
        name: preset.name,
        description: preset.description,
        operations: preset.operations.map(op => op.type),
      };
    });
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
