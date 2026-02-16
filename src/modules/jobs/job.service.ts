import type { Job, CreateJobInput, JobStatus } from './job.types';
import { JobModel } from './job.model';

export class JobService {
  async create(input: CreateJobInput): Promise<Job> {
    const job = await JobModel.create({
      userId: input.userId,
      status: 'pending',
      payload: input.payload,
    });

    return this.toJob(job);
  }

  async findById(jobId: string): Promise<Job | null> {
    const job = await JobModel.findById(jobId);
    return job ? this.toJob(job) : null;
  }

  async findByUserId(userId: string): Promise<Job[]> {
    const jobs = await JobModel.find({ userId }).sort({ createdAt: -1 });
    return jobs.map((job) => this.toJob(job));
  }

  async updateStatus(jobId: string, status: JobStatus, error?: string): Promise<Job | null> {
    const updateData: Partial<Job> = {
      status,
      ...(error && { error }),
      ...((status === 'completed' || status === 'failed') && { completedAt: new Date() }),
    };

    const job = await JobModel.findByIdAndUpdate(jobId, updateData, { new: true });
    return job ? this.toJob(job) : null;
  }

  async enqueue(job: Job): Promise<void> {
    console.log(`[MOCK QUEUE] Job enqueued: ${job.id}`);
    console.log(`[MOCK QUEUE] Type: ${job.payload.type}`);
    console.log(`[MOCK QUEUE] Operations: ${job.payload.operations.map((op) => op.type).join(', ')}`);

    // TODO: Implementar integração com sistema de filas real
    // await audioQueue.add('process-audio', { jobId: job.id });
  }

  private toJob(doc: any): Job {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      status: doc.status,
      payload: doc.payload,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      completedAt: doc.completedAt,
      error: doc.error,
      result: doc.result,
    };
  }
}

export const jobService = new JobService();
