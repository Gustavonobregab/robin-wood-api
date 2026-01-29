import { Elysia, t } from 'elysia';
import { validateDashboardAuth } from '../../middlewares/dashboard-auth';
import { usersService } from './users.service';
import { usageService } from '../usage/usage.service';
import { UserModel } from './users.model';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(validateDashboardAuth)

  // --- GET /me: Traz perfil + estatísticas ---
  .get('/me', async ({ userId }) => {
    // Busca pelo oderId ou _id, dependendo de como o middleware popula o userId
    // Assumindo que o validateDashboardAuth retorna o ID correto
    const user = await UserModel.findOne({ 
      $or: [{ oderId: userId }, { _id: userId }] 
    }).lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Busca estatísticas de uso (Total Requests)
    // Nota: O userId passado aqui deve bater com o salvo no UsageEvent
    const stats = await usageService.getUserStats(userId);

    return {
      data: {
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        stats: {
          totalRequests: stats.totalRequests,
          tokensUsed: user.tokens?.used || 0,
          tokensLimit: user.tokens?.limit || 0
        }
      }
    };
  })

  // --- PATCH /me: Atualiza APENAS o nome ---
  .patch('/me', async ({ userId, body }) => {
    const user = await UserModel.findOneAndUpdate(
      { $or: [{ oderId: userId }, { _id: userId }] },
      { $set: { name: body.name } },
      { new: true }
    );

    return { data: user };
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 })
    })
  })

  // ... (mantenha suas rotas antigas de webhook/tokens aqui) ...
  .get('/me/tokens', async ({ userId }) => {
    const result = await usageService.getCurrentUsage(userId);
    return { data: result };
  })
  .put('/webhook-config', async ({ userId, body }) => {
    const result = await usersService.updateWebhookUrl(userId, body.url);
    return { data: result };
  }, {
    body: t.Object({ url: t.String({ format: 'uri' }) }),
  });