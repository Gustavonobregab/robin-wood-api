import { Elysia } from 'elysia';
import { ApiError } from '../utils/api-error';
import { auth } from '../auth/better-auth'; // <--- AJUSTE O CAMINHO SE NECESSÁRIO

export const validateDashboardAuth = new Elysia({ name: 'validate-dashboard-auth' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    
    // 1. A Mágica: O Better Auth lê os cookies do request automaticamente
    const session = await auth.api.getSession({
      headers: request.headers
    });

    // 2. Se não retornou sessão, o usuário não está logado ou o cookie expirou
    if (!session) {
      throw new ApiError('AUTH_REQUIRED', 'Authentication is required', 401);
    }

    // 3. Sucesso! Retornamos o userId real do banco de dados
    return {
      userId: session.user.id, // Isso agora é o ID real (ex: string do Mongo)
      user: session.user,
      session: session.session
    };
  });