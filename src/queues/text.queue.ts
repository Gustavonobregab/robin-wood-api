export type TextQueueJob = {
  data: {
    jobId: string;
  };
  metadata: {
    step: 'CREATED' | 'PROCESSING' | 'DONE';
  };
};

export const TEXT_QUEUE = 'TEXT_QUEUE';
