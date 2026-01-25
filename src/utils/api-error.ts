import { Elysia } from 'elysia';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

export const apiErrorPlugin = new Elysia({ name: 'api-error' })
  .error({ API_ERROR: ApiError })
  .onError({ as: 'global' }, ({ error, code, set }) => {
    if (code === 'API_ERROR') {
      set.status = error.status;
      return {
        error: { code: error.code, message: error.message },
        status: error.status,
      };
    }

    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        error: { code: 'VALIDATION_ERROR', message: error.message },
        status: 400,
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
        status: 404,
      };
    }

    set.status = 500;
    return {
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      status: 500,
    };
  })
  .mapResponse({ as: 'global' }, ({ response, set }) => {
    if (response && typeof response === 'object' && 'error' in (response as object)) {
      return Response.json(response);
    }

    return Response.json({
      data: response,
      status: set.status || 200,
    });
  });
