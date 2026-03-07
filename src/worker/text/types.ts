import type { TEXT_OPERATIONS, TextOperationType } from '../../modules/text/text.types';

type OperationParams<T extends TextOperationType> =
  typeof TEXT_OPERATIONS[T]['params'];

type ExtractParamValues<P> = {
  [K in keyof P]: P[K] extends { type: 'number' } ? number
    : P[K] extends { type: 'boolean' } ? boolean
    : P[K] extends { type: 'string' } ? string
    : never;
};

export interface TextOperationHandler<T extends TextOperationType> {
  type: T;
  process(input: string, params: ExtractParamValues<OperationParams<T>>): Promise<string>;
}
