import type { Job } from 'bullmq';
import { jobService } from '../modules/jobs/job.service';

export type TextQueueJob = {
  data: {
    jobId: string;
  };
  metadata: {
    step: 'CREATED' | 'PROCESSING' | 'DONE';
  };
};

export const TEXT_QUEUE = 'TEXT_QUEUE';

export default async function (job: Job<TextQueueJob>) {
  const { data, metadata } = job.data;
  console.log(`[TEXT_QUEUE] Processing job ${data.jobId}`);

  if (metadata.step === 'CREATED') {
    await jobService.updateStatus(data.jobId, 'running');

    job.data.metadata.step = 'PROCESSING';
    await job.updateData(job.data);
  }

  if (metadata.step === 'PROCESSING') {
    // TODO: implement actual text processing logic

    job.data.metadata.step = 'DONE';
    await job.updateData(job.data);
  }

  if (metadata.step === 'DONE') {
    await jobService.updateStatus(data.jobId, 'succeeded');
  }

  console.log(`[TEXT_QUEUE] Finished job ${data.jobId}`);
}
