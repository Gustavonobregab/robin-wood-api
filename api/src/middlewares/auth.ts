import { Elysia } from 'elysia';

// TODO: Replace stub with real session validation (better-auth) once login is implemented
export const validateAuth = new Elysia({ name: 'validate-auth' })
  .derive({ as: 'scoped' }, async () => {
    return {
      userId: 'stub-user-id',
    };
  });
