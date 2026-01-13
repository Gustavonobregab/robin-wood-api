import { SubscriptionModel, PlanModel, type Subscription } from './subscriptions.model';

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
