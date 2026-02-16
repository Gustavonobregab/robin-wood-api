import { Schema, model, Model } from 'mongoose';
import type { Job } from './job.types';

const jobSchema = new Schema<Job>(
  {
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    payload: {
      type: { type: String, enum: ['audio', 'text'], required: true },
      operations: { type: [Schema.Types.Mixed], required: true },
      originalFilename: { type: String, required: true },
      inputSize: { type: Number, required: true },
    },
    completedAt: { type: Date },
    error: { type: String },
    result: {
      outputUrl: { type: String },
      metrics: { type: Schema.Types.Mixed },
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: 1 });

export const JobModel: Model<Job> = model<Job>('Job', jobSchema);
