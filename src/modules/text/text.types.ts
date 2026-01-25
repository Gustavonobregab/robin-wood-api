export interface TextDetails {
  charCount: number;
  originalCharCount: number;
}

export interface Metrics {
  compressionRatio: string; // "15.5%"
  savedChars: number;
}

export interface PipelineResult<TData, TDetails> {
  data: TData;
  metrics: Metrics;
  details: TDetails;
  operations: string[];
}

export function calculateMetrics(original: number, final: number): Metrics {
  const saved = original - final;
  const ratio = original > 0 ? ((saved / original) * 100).toFixed(2) : '0.00';
  
  return {
    savedChars: saved,
    compressionRatio: `${ratio}%`
  };
}