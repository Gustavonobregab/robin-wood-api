import type { Job } from 'bullmq';
import type { TextQueueJob } from '../queues/text.queue';
import type { TextJobPayload } from '../modules/jobs/job.types';
import { JobModel } from '../modules/jobs/job.model';
import { processText } from './text/pipeline';

export default async function (job: Job<TextQueueJob>) {
  const { data } = job.data;

  const jobDoc = await JobModel.findById(data.jobId);

  if (!jobDoc) {
    throw new Error(`Job ${data.jobId} not found`);
  }

  const payload = jobDoc.payload as unknown as TextJobPayload;

  await JobModel.findByIdAndUpdate(data.jobId, { status: 'processing' });

  try {
    const source = payload.source;

    const url = source.kind === 'url' ? source.url : source.ref;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download text: ${response.status}`);
    }

    const input = await response.text();

    const inputSize = new TextEncoder().encode(input).byteLength;

    const output = await processText(input, payload.operations);
    
    const outputSize = new TextEncoder().encode(output).byteLength;

    // TODO: upload output to storage and get outputUrl

    await JobModel.findByIdAndUpdate(data.jobId, {
      status: 'completed',
      completedAt: new Date(),
      result: {
        metrics: {
          inputSize,
          outputSize,
          compressionRatio: +(inputSize / outputSize).toFixed(2),
          operationsApplied: payload.operations.map((op) => op.type),
        },
      },
    });
  } catch (err) {
    await JobModel.findByIdAndUpdate(data.jobId, {
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    throw err;
  }
}
