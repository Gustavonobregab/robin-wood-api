import { Elysia } from 'elysia';

export const validateApiKey = new Elysia()
  .derive(async ({ headers }) => {
    const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    // TODO: Validate API key against database
    return { apiKey };
  });
