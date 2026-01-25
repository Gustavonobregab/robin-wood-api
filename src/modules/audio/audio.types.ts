// src/modules/audio/audio.types.ts
import { PipelineResult } from '../../lib/pipeline';

// O dado que flui no pipeline é um Buffer (Raw PCM Float32)
export type AudioData = Buffer | ArrayBuffer | Uint8Array;

export interface AudioDetails {
  duration: number;         // Em segundos
  sampleRate: number;       // Ex: 44100
  originalDuration: number; // Em segundos
  silenceRemoved: number;   // Em segundos
}

export type AudioResult = PipelineResult<AudioData, AudioDetails>;

export function calculateMetrics(originalSize: number, finalSize: number) {
  const saved = originalSize - finalSize;
  const ratio = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(2) : '0.00';
  
  return {
    savedBytes: saved,
    compressionRatio: `${ratio}%`
  };
}