import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface Text {
  _id: ObjectId;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  encoding?: string;
  language?: string;
  charCount?: number;
  wordCount?: number;
  storagePath?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTextInput {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  encoding?: string;
  language?: string;
  charCount?: number;
  wordCount?: number;
  storagePath?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTextInput {
  name?: string;
  metadata?: Record<string, unknown>;
}

const textSchema = new Schema<Text>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  encoding: { type: String },
  language: { type: String },
  charCount: { type: Number },
  wordCount: { type: Number },
  storagePath: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

textSchema.index({ userId: 1, createdAt: -1 });

export const TextModel: Model<Text> = model<Text>('Text', textSchema);
