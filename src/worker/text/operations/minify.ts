import type { TextOperationHandler } from '../types';

export const minify: TextOperationHandler<'minify'> = {
  type: 'minify',

  async process(input, params) {
    let result = input;

    // Remove all extra whitespace
    result = result.replace(/\s+/g, ' ').trim();

    // Higher intensity: remove articles and filler words
    if (params.intensity > 40) {
      result = result.replace(/\b(the|a|an|is|are|was|were|be|been|being)\b/gi, '');
      result = result.replace(/\s{2,}/g, ' ').trim();
    }

    // Higher intensity: abbreviate common patterns
    if (params.intensity > 70) {
      result = result.replace(/\band\b/gi, '&');
      result = result.replace(/\bor\b/gi, '/');
      result = result.replace(/\s{2,}/g, ' ').trim();
    }

    return result;
  },
};
