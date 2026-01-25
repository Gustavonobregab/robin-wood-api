import { SubscriptionModel, PlanModel } from './subscriptions.model';
import type { Subscription } from './subscriptions.types';

export class SubscriptionsService {
  async getSubscriptionByUserId(userId: string) {
    // TODO: Implement get subscription
    return null;
  }

  async createSubscription(userId: string, planSlug: string) {
    // TODO: Implement create subscription
    return null;
  }

  async updateSubscription(userId: string, updates: Partial<Subscription>) {
    // TODO: Implement update subscription
  }
}
