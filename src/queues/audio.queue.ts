import type { Job } from 'bullmq';
import { JobModel } from '../modules/jobs/job.model';

export type AudioQueueJob = {
  data: {
    jobId: string;
  };
  metadata: {
    step: 'CREATED' | 'PROCESSING' | 'DONE';
  };
};

export const AUDIO_QUEUE = 'AUDIO_QUEUE';

export default async function (job: Job<AudioQueueJob>) {
  const { data, metadata } = job.data;
  console.log(`[AUDIO_QUEUE] Processing job ${data.jobId} | step: ${metadata.step}`);

  if (metadata.step === 'CREATED') {
    await JobModel.findByIdAndUpdate(data.jobId, { status: 'running' });

    // TODO: implement actual audio processing logic

    job.data.metadata.step = 'PROCESSING';
    await job.updateData(job.data);
  }

  if (metadata.step === 'PROCESSING') {
    await JobModel.findByIdAndUpdate(data.jobId, { status: 'succeeded' });

    job.data.metadata.step = 'DONE';
    await job.updateData(job.data);
  }

  console.log(`[AUDIO_QUEUE] Finished job ${data.jobId}`);
}
