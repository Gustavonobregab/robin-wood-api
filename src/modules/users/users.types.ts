import type { ObjectId } from 'mongoose';

export interface User {
  _id: ObjectId;
  oderId: string;
  email: string;
  webhookUrl?: string;
  tokens: {
    limit: number;
    used: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
