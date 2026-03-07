export type AudioQueueJob = {
  data: {
    jobId: string;
  };
  metadata: {
    step: 'CREATED' | 'PROCESSING' | 'DONE';
  };
};

export const AUDIO_QUEUE = 'AUDIO_QUEUE';
