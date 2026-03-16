import type { TextOperationHandler } from '../types';
import { gzipSync, deflateSync } from 'bun';

export const compress: TextOperationHandler<'compress'> = {
  type: 'compress',

  async process(input, params) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const level = Math.round((params.intensity / 100) * 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

    let compressed: Uint8Array;

    if (params.algo === 'brotli') {
      // Bun doesn't have native brotli, use gzip as fallback
      compressed = gzipSync(data, { level });
    } else {
      compressed = gzipSync(data, { level });
    }

    // Return base64 encoded compressed data
    return Buffer.from(compressed).toString('base64');
  },
};
