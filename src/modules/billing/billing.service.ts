import { PricingModel, InvoiceModel, UserBillingInfoModel } from './billing.model';
import type { Pricing, Invoice, UserBillingInfo } from './billing.types';
import { ApiError } from '../../utils/api-error';

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
    throw new ApiError('NOT_IMPLEMENTED', 'Invoice creation not implemented', 501);
  }

  async getUserBillingInfo(userId: string): Promise<UserBillingInfo | null> {
    // TODO: Implement get user billing info
    return null;
  }
}
