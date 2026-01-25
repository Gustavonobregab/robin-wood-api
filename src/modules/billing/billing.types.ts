import type { ObjectId } from 'mongoose';

export interface Pricing {
  _id: ObjectId;
  pipelineType: 'audio' | 'image' | 'text' | 'video';
  pricePerGbSaved: number;
  freeTierOperations: number;
  freeTierGbSaved?: number;
  currency: 'USD';
  active: boolean;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  createdAt: Date;
}

export interface InvoiceLineItem {
  pipelineType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  _id: ObjectId;
  userId: string;
  year: number;
  month: number;
  period: string;
  subtotalUsd: number;
  taxUsd: number;
  totalUsd: number;
  lineItems: InvoiceLineItem[];
  status: 'draft' | 'issued' | 'paid' | 'failed' | 'void';
  paymentMethod?: 'stripe' | 'manual';
  stripeInvoiceId?: string;
  paidAt?: Date;
  issuedAt: Date;
  dueAt: Date;
  createdAt: Date;
}

export interface UserBillingInfo {
  _id: ObjectId;
  userId: string;
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
    country: string;
  };
  currentPeriod: {
    year: number;
    month: number;
    totalCostUsd: number;
    lastCalculatedAt: Date;
  };
  paymentStatus: 'active' | 'past_due' | 'suspended';
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
