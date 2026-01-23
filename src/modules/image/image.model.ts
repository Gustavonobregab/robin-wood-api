import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface Image {
  _id: ObjectId;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  storagePath?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImageInput {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  storagePath?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateImageInput {
  name?: string;
  metadata?: Record<string, unknown>;
}

const imageSchema = new Schema<Image>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  colorSpace: { type: String },
  hasAlpha: { type: Boolean },
  storagePath: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

imageSchema.index({ userId: 1, createdAt: -1 });

export const ImageModel: Model<Image> = model<Image>('Image', imageSchema);
