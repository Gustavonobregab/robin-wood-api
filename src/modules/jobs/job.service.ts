import type { JobStatus, JobPayload, Job } from './job.types';
import { JobModel } from './job.model';

export class JobService {
  async create(input: { userId: string; payload: JobPayload }): Promise<Job> {
    const doc = await JobModel.create({
      userId: input.userId,
      status: 'created',
      payload: input.payload,
    });

    return this.toJob(doc);
  }

  async findById(jobId: string): Promise<Job | null> {
    const doc = await JobModel.findById(jobId);
    return doc ? this.toJob(doc) : null;
  }

  async findByUserId(userId: string): Promise<Job[]> {
    const docs = await JobModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map((doc) => this.toJob(doc));
  }

  async updateStatus(jobId: string, status: JobStatus, error?: string): Promise<Job | null> {
    const doc = await JobModel.findByIdAndUpdate(
      jobId,
      { status, ...(error && { error }) },
      { new: true },
    );
    return doc ? this.toJob(doc) : null;
  }

  async enqueue(_job: Job): Promise<void> {
    // TODO: Implement integration with real queue system
  }

  private toJob(doc: any): Job {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      error: doc.error,
    };
  }
}

export const jobService = new JobService();
