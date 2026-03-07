import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import type { Job } from 'bullmq';
import type { AudioQueueJob } from '../queues/audio.queue';
import type { AudioJobPayload } from '../modules/jobs/job.types';
import { JobModel } from '../modules/jobs/job.model';
import { processAudioFile } from './audio/pipeline';

export default async function (job: Job<AudioQueueJob>) {
  const { data } = job.data;

  const jobDoc = await JobModel.findById(data.jobId);

  if (!jobDoc) {
    throw new Error(`Job ${data.jobId} not found`);
  }

  const payload = jobDoc.payload as unknown as AudioJobPayload;

  await JobModel.findByIdAndUpdate(data.jobId, { status: 'processing' });

  const workDir = await mkdtemp(join(tmpdir(), 'rw-audio-'));

  const inputPath = join(workDir, 'input');

  const outputPath = join(workDir, 'output.mp3');

  try {
    const source = payload.source;

    const url = source.kind === 'url' ? source.url : source.ref;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    await Bun.write(inputPath, buffer);

    const inputSize = buffer.byteLength;

    await processAudioFile(inputPath, outputPath, payload.operations);

    const outputFile = Bun.file(outputPath);

    const outputSize = outputFile.size;

    // TODO: upload outputPath to storage and get outputUrl

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
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
