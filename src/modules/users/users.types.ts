import type { ObjectId } from 'mongoose';

export interface User {
  _id?: ObjectId;
  name: string;
  oderId?: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  webhookUrl?: string;
  tokens: {
    limit: number;
    used: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
