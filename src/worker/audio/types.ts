import type { AUDIO_OPERATIONS, AudioOperationType } from '../../modules/audio/audio.types';

type OperationParams<T extends AudioOperationType> =
  typeof AUDIO_OPERATIONS[T]['params'];

type ExtractParamValues<P> = {
  [K in keyof P]: P[K] extends { type: 'number' } ? number
    : P[K] extends { type: 'boolean' } ? boolean
    : P[K] extends { type: 'string' } ? string
    : never;
};

export interface AudioOperationHandler<T extends AudioOperationType> {
  type: T;
  process(inputPath: string, outputPath: string, params: ExtractParamValues<OperationParams<T>>): Promise<void>;
}
