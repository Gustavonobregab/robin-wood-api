import type { Job } from 'bullmq';
import type { TextQueueJob } from '../queues/text.queue';
import { JobModel } from '../modules/jobs/job.model';

export default async function (job: Job<TextQueueJob>) {
  const { data, metadata } = job.data;
  console.log(`[TEXT_QUEUE] Processing job ${data.jobId} | step: ${metadata.step}`);

  if (metadata.step === 'CREATED') {
    await JobModel.findByIdAndUpdate(data.jobId, { status: 'running' });

    // TODO: implement actual text processing logic

    job.data.metadata.step = 'PROCESSING';
    await job.updateData(job.data);
  }

  if (metadata.step === 'PROCESSING') {
    await JobModel.findByIdAndUpdate(data.jobId, { status: 'succeeded' });

    job.data.metadata.step = 'DONE';
    await job.updateData(job.data);
  }

  console.log(`[TEXT_QUEUE] Finished job ${data.jobId}`);
}
