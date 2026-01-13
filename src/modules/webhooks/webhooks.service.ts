import { WebhookEventModel, type WebhookEvent } from './webhooks.model';

export class WebhooksService {
  async createEvent(userId: string, eventType: WebhookEvent['eventType'], payload: Record<string, any>): Promise<WebhookEvent> {
    // TODO: Implement webhook event creation
    throw new Error('Not implemented');
  }

  async deliverEvent(eventId: string): Promise<void> {
    // TODO: Implement webhook delivery
  }

  async retryFailedEvents(): Promise<void> {
    // TODO: Implement retry logic
  }
}
