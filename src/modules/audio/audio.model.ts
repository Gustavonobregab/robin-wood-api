import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface Audio {
  _id: ObjectId;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  format?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  storagePath?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAudioInput {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  format?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  storagePath?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAudioInput {
  name?: string;
  metadata?: Record<string, unknown>;
}

const audioSchema = new Schema<Audio>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  duration: { type: Number },
  format: { type: String },
  sampleRate: { type: Number },
  channels: { type: Number },
  bitrate: { type: Number },
  storagePath: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

audioSchema.index({ userId: 1, createdAt: -1 });

export const AudioModel: Model<Audio> = model<Audio>('Audio', audioSchema);
