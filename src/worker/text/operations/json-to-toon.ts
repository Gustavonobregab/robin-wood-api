import type { TextOperationHandler } from '../types';

export const jsonToToon: TextOperationHandler<'json-to-toon'> = {
  type: 'json-to-toon',

  async process(input, params) {
    const parsed = JSON.parse(input);
    return toToon(parsed, 0, params.intensity);
  },
};

function toToon(value: unknown, depth: number, intensity: number): string {
  if (value === null || value === undefined) return '~';
  if (typeof value === 'boolean') return value ? '+' : '-';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.includes(' ') ? `"${value}"` : value;

  const indent = intensity > 50 ? '' : '  '.repeat(depth);
  const newline = intensity > 50 ? ' ' : '\n';
  const separator = intensity > 50 ? ',' : newline;

  if (Array.isArray(value)) {
    const items = value.map((item) => `${indent}${toToon(item, depth + 1, intensity)}`);
    return `[${separator}${items.join(separator)}${separator}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const lines = entries.map(([key, val]) => {
      return `${indent}${key}:${toToon(val, depth + 1, intensity)}`;
    });
    return lines.join(separator);
  }

  return String(value);
}
