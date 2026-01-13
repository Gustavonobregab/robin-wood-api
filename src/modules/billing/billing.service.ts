import { PricingModel, InvoiceModel, UserBillingInfoModel, type Pricing, type Invoice, type UserBillingInfo } from './billing.model';

export class BillingService {
  async getCurrentBilling(userId: string): Promise<UserBillingInfo | null> {
    // TODO: Implement get current billing info
    return null;
  }

  async getPricing(pipelineType: 'audio' | 'image' | 'text' | 'video'): Promise<Pricing | null> {
    // TODO: Implement get pricing for pipeline type
    return null;
  }

  async createInvoice(userId: string, period: string): Promise<Invoice> {
    // TODO: Implement invoice creation
    throw new Error('Not implemented');
  }

  async getUserBillingInfo(userId: string): Promise<UserBillingInfo | null> {
    // TODO: Implement get user billing info
    return null;
  }
}
