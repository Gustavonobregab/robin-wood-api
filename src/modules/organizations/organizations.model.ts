import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';

export interface OrganizationMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  addedAt: Date;
  addedBy: string; // User ID
}

export interface Organization {
  _id: ObjectId;
  name: string;
  slug: string; 
  ownerId: string; // User ID
  members: OrganizationMember[];
  billingEmail: string; // Inherited billing
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const organizationMemberSchema = new Schema<OrganizationMember>({
  userId: { type: String, required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], required: true },
  addedAt: { type: Date, default: Date.now },
  addedBy: { type: String, required: true },
}, { _id: false });

const organizationSchema = new Schema<Organization>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  members: { type: [organizationMemberSchema], default: [] },
  billingEmail: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ 'members.userId': 1 });

export const OrganizationModel: Model<Organization> = model<Organization>('Organization', organizationSchema);
