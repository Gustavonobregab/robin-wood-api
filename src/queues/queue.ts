import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import textProcessor, { TEXT_QUEUE, type TextQueueJob } from './text.queue';
import audioProcessor, { AUDIO_QUEUE, type AudioQueueJob } from './audio.queue';

const textQueue = new Queue<TextQueueJob>(TEXT_QUEUE, { connection: redisConnection });
const audioQueue = new Queue<AudioQueueJob>(AUDIO_QUEUE, { connection: redisConnection });

export const queues = {
  text: textQueue,
  audio: audioQueue,
};

export function startWorkers() {
  const textWorker = new Worker<TextQueueJob>(
    TEXT_QUEUE,
    textProcessor,
    { connection: redisConnection },
  );

  const audioWorker = new Worker<AudioQueueJob>(
    AUDIO_QUEUE,
    audioProcessor,
    { connection: redisConnection },
  );

  for (const worker of [textWorker, audioWorker]) {
    worker.on('failed', (job, err) => {
      console.error(`[Queue] Job ${job?.data.data.jobId} failed: ${err.message}`);
    });

    worker.on('completed', (job) => {
      console.log(`[Queue] Job ${job.data.data.jobId} completed`);
    });
  }

  console.log('[Queue] Workers started for TEXT_QUEUE and AUDIO_QUEUE');
}
