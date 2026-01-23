import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface Video {
  _id: ObjectId;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  codec?: string;
  fps?: number;
  bitrate?: number;
  hasAudio?: boolean;
  storagePath?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVideoInput {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  codec?: string;
  fps?: number;
  bitrate?: number;
  hasAudio?: boolean;
  storagePath?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateVideoInput {
  name?: string;
  metadata?: Record<string, unknown>;
}

const videoSchema = new Schema<Video>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  duration: { type: Number },
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  codec: { type: String },
  fps: { type: Number },
  bitrate: { type: Number },
  hasAudio: { type: Boolean },
  storagePath: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

videoSchema.index({ userId: 1, createdAt: -1 });

export const VideoModel: Model<Video> = model<Video>('Video', videoSchema);
