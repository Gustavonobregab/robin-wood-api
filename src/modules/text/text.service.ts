import {
  TEXT_PRESETS,
  TEXT_OPERATIONS,
  type StealTextInput,
  type TextPreset,
  type TextOperation
} from './text.types';
import { ApiError } from '../../utils/api-error';
import { TextPipeline, type TextResult } from './text.pipeline';
import { usersService } from '../users/users.service';

export class TextService {
  
  async stealText(userId: string, input: StealTextInput): Promise<TextResult> {
    const { preset, operations: customOps, file } = input;

    // 1. Extrair conteúdo do arquivo (Mudança principal devido ao model)
    if (!file) {
        throw new ApiError('TEXT_INVALID_INPUT', 'File is required', 400);
    }
    const content = await file.text(); // Método nativo do objeto File/Blob no Bun

    if (!content) {
      throw new ApiError('TEXT_INVALID_INPUT', 'File content is empty', 400);
    }

    // 2. Determinar operações
    if (!preset && (!customOps || customOps.length === 0)) {
      throw new ApiError(
        'TEXT_INVALID_INPUT',
        'Either preset or operations must be provided',
        400,
      );
    }

    // Tipagem forçada para ajudar o TS a entender a estrutura vinda do PRESETS vs customOps
    const operationsToRun = (preset
      ? TEXT_PRESETS[preset as TextPreset].operations
      : customOps!) as TextOperation[];

    // 3. Instanciar Pipeline
    const pipeline = new TextPipeline(content);

    // 4. Aplicar operações (Mapeamento estrito ao Model)
    for (const op of operationsToRun) {
      if (op.type === 'syntax') {
        pipeline.syntax(op.params);
      } 
      else if (op.type === 'json-to-toon') {
        pipeline.jsonToToon(op.params);
      }
    }

    // 5. Executar
    const result = await pipeline.execute();

    // 6. Billing (Cobra 1 crédito por arquivo processado)
    try {
      await usersService.incrementFreeTierUsage(userId, 1);
    } catch (error) {
      console.error('Billing error:', error);
    }

    return result;
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