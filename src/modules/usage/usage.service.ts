import { UsageEventModel, UsageMonthlyModel, type UsageEvent } from './usage.model';

export class UsageService {
  async recordEvent(event: Omit<UsageEvent, '_id' | 'timestamp'>): Promise<void> {
    // TODO: Implement event recording
  }

  async recordBatch(events: Omit<UsageEvent, '_id' | 'timestamp'>[]): Promise<void> {
    // TODO: Implement batch recording
  }

  async getMonthlyUsage(userId: string, year: number, month: number) {
    // TODO: Implement get monthly usage
    return null;
  }
}
