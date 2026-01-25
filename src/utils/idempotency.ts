import { createHash } from 'crypto';

export function generateIdempotencyKey(
  userId: string,
  pipelineType: string,
  inputHash: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const window = Math.floor(ts / 60000); // 1 minute

  const data = `${userId}:${pipelineType}:${inputHash}:${window}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}

export function hashFile(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').substring(0, 16);
}

export function hashInput(data: {
  userId: string;
  pipelineType: string;
  operations: string[];
  inputSize: number;
}): string {
  const content = `${data.userId}:${data.pipelineType}:${data.operations.join(',')}:${data.inputSize}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}
