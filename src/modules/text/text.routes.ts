import { Elysia, t } from 'elysia';
import { validateApiKey } from '../../middlewares/validate-api-key';
import { textService } from './text.service';

export const textRoutes = new Elysia({ prefix: '/text' })
  .use(validateApiKey)

  .post(
    '/',
    async ({ body, userId }) => {
      return await textService.create(userId, body);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        originalName: t.String({ minLength: 1 }),
        mimeType: t.String({ minLength: 1 }),
        size: t.Number({ minimum: 0 }),
        encoding: t.Optional(t.String()),
        language: t.Optional(t.String()),
        charCount: t.Optional(t.Number({ minimum: 0 })),
        wordCount: t.Optional(t.Number({ minimum: 0 })),
        storagePath: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
    }
  )

  .get(
    '/',
    async ({ query, userId }) => {
      return await textService.list(userId, {
        limit: query.limit,
        offset: query.offset,
      });
    },
    {
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: t.Optional(t.Number({ minimum: 0, default: 0 })),
      }),
    }
  )

  .get(
    '/:id',
    async ({ params, userId }) => {
      return await textService.getById(userId, params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  .patch(
    '/:id',
    async ({ params, body, userId }) => {
      return await textService.update(userId, params.id, body);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
    }
  )

  .delete(
    '/:id',
    async ({ params, userId }) => {
      return await textService.delete(userId, params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
