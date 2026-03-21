import type { TextOperationHandler } from '../types';

export const trim: TextOperationHandler<'trim'> = {
  type: 'trim',

  async process(input, params) {
    let result = input;

    // Remove extra whitespace
    result = result.replace(/[ \t]+/g, ' ');
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.trim();

    // Higher intensity: fix punctuation spacing
    if (params.intensity > 30) {
      result = result.replace(/\s+([.,;:!?])/g, '$1');
      result = result.replace(/([.,;:!?])(?=[A-Za-z])/g, '$1 ');
    }

    // Higher intensity: normalize unicode quotes; collapse dash variants to space
    if (params.intensity > 60) {
      result = result.replace(/[""]/g, '"');
      result = result.replace(/['']/g, "'");
      result = result.replace(/[–—]/g, '-');
    }

    return result;
  },
};
