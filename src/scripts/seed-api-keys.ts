import mongoose from 'mongoose';
import { ApiKeyModel } from '../modules/keys/keys.model';

const MOCK_API_KEYS = [
  {
    userId: 'user_test_001',
    key: 'sk_live_robin_test_key_001',
    name: 'Test Key 1',
    status: 'active' as const,
  },
  {
    userId: 'user_test_002',
    key: 'sk_live_robin_test_key_002',
    name: 'Test Key 2',
    status: 'active' as const,
  },
  {
    userId: 'user_test_001',
    key: 'sk_live_robin_dev_key_001',
    name: 'Development Key',
    status: 'active' as const,
  },
];

async function seedApiKeys() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    for (const keyData of MOCK_API_KEYS) {
      const existing = await ApiKeyModel.findOne({ key: keyData.key });
      if (existing) {
        console.log(`Key already exists: ${keyData.key}`);
        continue;
      }

      await ApiKeyModel.create(keyData);
      console.log(`Created key: ${keyData.key}`);
    }

    console.log('Seed completed!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedApiKeys();
