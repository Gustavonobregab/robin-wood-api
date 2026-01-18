import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { usageService } from './usage.service';

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId, apiKey }) => {
      return await usageService.recordBatch(body.events, apiKey, userId);
    },
    {
      body: t.Object({
        events: t.Array(
          t.Object({
            pipelineType: t.Union([
              t.Literal('audio'),
              t.Literal('image'),
              t.Literal('text'),
              t.Literal('video'),
            ]),
            operations: t.Array(t.String({ minLength: 1 })),
            inputSizeBytes: t.Number({ minimum: 0 }),
            outputSizeBytes: t.Number({ minimum: 0 }),
            bytesSaved: t.Number(),
            compressionRatio: t.Number({ minimum: 0 }),
            durationMs: t.Number({ minimum: 0 }),
            timestamp: t.Optional(t.String()),
            clientVersion: t.Optional(t.String()),
            environment: t.Optional(t.String()),
          }),
          { minItems: 1, maxItems: 100 }
        ),
      }),
    }
  )

  .get('/current', async ({ userId }) => {
    return await usageService.getCurrentUsage(userId);
  })

  .get(
    '/history',
    async ({ query, userId }) => {
      return await usageService.getUsageHistory(userId, {
        startPeriod: query.startPeriod,
        endPeriod: query.endPeriod,
        limit: query.limit,
      });
    },
    {
      query: t.Object({
        startPeriod: t.Optional(t.String()),
        endPeriod: t.Optional(t.String()),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 24, default: 12 })),
      }),
    }
  )

  .get('/limits', async ({ userId }) => {
    return await usageService.getUserLimits(userId);
  });
