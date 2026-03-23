import { connectDatabase } from '../config/database';
import { PlanModel } from '../modules/plans/plans.model';

const MB = 1024 * 1024;

const DEFAULT_PLANS = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Get started with Robin Wood for free',
    credits: 100,
    creditWeights: { text: 1, image: 3, audio: 5, video: 10 },
    features: { maxFileSize: 25 * MB, maxApiKeys: 2, webhooks: false },
    isPublic: true,
    isDefault: true,
    active: true,
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'For professionals who need more processing power',
    credits: 1000,
    creditWeights: { text: 1, image: 3, audio: 5, video: 10 },
    features: { maxFileSize: 100 * MB, maxApiKeys: 5, webhooks: true },
    isPublic: true,
    isDefault: false,
    active: true,
  },
];

async function seed() {
  await connectDatabase();

  for (const plan of DEFAULT_PLANS) {
    const existing = await PlanModel.findOne({ slug: plan.slug });
    if (existing) {
      console.log(`Plan "${plan.slug}" already exists, skipping`);
      continue;
    }
    await PlanModel.create(plan);
    console.log(`Created plan "${plan.slug}" (${plan.credits} credits)`);
  }

  console.log('Done seeding plans');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
