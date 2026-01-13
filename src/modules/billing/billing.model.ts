import { Schema, model, Model } from 'mongoose';
import type { ObjectId } from 'mongoose';
export interface Pricing {
  _id: ObjectId;
  pipelineType: 'audio' | 'image' | 'text' | 'video';
  pricePerGbSaved: number; // e.g., 10.00
  freeTierOperations: number; // e.g., 1000 free operations
  freeTierGbSaved?: number;
  currency: 'USD';
  active: boolean;
  effectiveFrom: Date; // Price versioning control
  effectiveUntil?: Date; // null = current
  createdAt: Date;
}
export interface InvoiceLineItem {
  pipelineType: string;
  description: string; // "Audio processing - 150GB saved"
  quantity: number; // GB saved
  unitPrice: number; // Price per GB
  amount: number; // quantity * unitPrice
}

export interface Invoice {
  _id: ObjectId;
  userId: string;
  year: number;
  month: number;
  period: string; // "2026-01"
  subtotalUsd: number;
  taxUsd: number; // Currently 0
  totalUsd: number;
  lineItems: InvoiceLineItem[]; // Breakdown by pipeline
  status: 'draft' | 'issued' | 'paid' | 'failed' | 'void';
  paymentMethod?: 'stripe' | 'manual';
  stripeInvoiceId?: string;
  paidAt?: Date;
  issuedAt: Date;
  dueAt: Date;
  createdAt: Date;
  organizationId?: string;
}

export interface UserBillingInfo {
  _id: ObjectId;
  userId: string; // Better Auth ID (unique)
  stripeCustomerId?: string;
  paymentMethod?: {
    type: 'card';
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  billingEmail?: string;
  company?: string;
  taxId?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string; // ISO code
  };
  currentPeriod: {
    year: number;
    month: number;
    totalCostUsd: number; // Running total for current month
    lastCalculatedAt: Date;
  };
  paymentStatus: 'active' | 'past_due' | 'suspended';
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string;
}

const pricingSchema = new Schema<Pricing>({
  pipelineType: { type: String, enum: ['audio', 'image', 'text', 'video'], required: true },
  pricePerGbSaved: { type: Number, required: true },
  freeTierOperations: { type: Number, required: true },
  freeTierGbSaved: Number,
  currency: { type: String, enum: ['USD'], default: 'USD' },
  active: { type: Boolean, default: true, index: true },
  effectiveFrom: { type: Date, required: true, index: true },
  effectiveUntil: Date,
  createdAt: { type: Date, default: Date.now },
});

const invoiceLineItemSchema = new Schema<InvoiceLineItem>({
  pipelineType: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new Schema<Invoice>({
  userId: { type: String, required: true, index: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  period: { type: String, required: true, index: true },
  subtotalUsd: { type: Number, required: true },
  taxUsd: { type: Number, default: 0 },
  totalUsd: { type: Number, required: true },
  lineItems: { type: [invoiceLineItemSchema], required: true },
  status: { type: String, enum: ['draft', 'issued', 'paid', 'failed', 'void'], default: 'draft', index: true },
  paymentMethod: { type: String, enum: ['stripe', 'manual'] },
  stripeInvoiceId: String,
  paidAt: Date,
  issuedAt: { type: Date, default: Date.now },
  dueAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  organizationId: String,
});

const userBillingInfoSchema = new Schema<UserBillingInfo>({
  userId: { type: String, required: true, unique: true, index: true },
  stripeCustomerId: { type: String, index: true },
  paymentMethod: {
    type: { type: String, enum: ['card'] },
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
  },
  billingEmail: String,
  company: String,
  taxId: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  currentPeriod: {
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    totalCostUsd: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  paymentStatus: { type: String, enum: ['active', 'past_due', 'suspended'], default: 'active', index: true },
  suspendedAt: Date,
  suspensionReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  organizationId: String,
});

pricingSchema.index({ pipelineType: 1, active: 1, effectiveFrom: -1 });

invoiceSchema.index({ userId: 1, period: 1 }, { unique: true });
invoiceSchema.index({ status: 1, dueAt: 1 });
invoiceSchema.index({ organizationId: 1, period: 1 });

userBillingInfoSchema.index({ userId: 1 }, { unique: true });
userBillingInfoSchema.index({ stripeCustomerId: 1 });
userBillingInfoSchema.index({ paymentStatus: 1 });
userBillingInfoSchema.index({ organizationId: 1 });

export const PricingModel: Model<Pricing> = model<Pricing>('Pricing', pricingSchema);
export const InvoiceModel: Model<Invoice> = model<Invoice>('Invoice', invoiceSchema);
export const UserBillingInfoModel: Model<UserBillingInfo> = model<UserBillingInfo>('UserBillingInfo', userBillingInfoSchema);
