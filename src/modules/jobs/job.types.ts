import type { AudioOperation } from '../audio/audio.types';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'audio' | 'text';

export interface AudioJobPayload {
  type: 'audio';
  operations: AudioOperation[];
  originalFilename: string;
  inputSize: number;
}

export type JobPayload = AudioJobPayload;

export interface Job {
  id: string;
  userId: string;
  status: JobStatus;
  payload: JobPayload;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: {
    outputUrl?: string;
    metrics?: Record<string, unknown>;
  };
}

export interface CreateJobInput {
  userId: string;
  payload: JobPayload;
}
