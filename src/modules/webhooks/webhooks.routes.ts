import { Router } from 'express';
import { WebhooksService } from './webhooks.service';

const router = Router();
const webhooksService = new WebhooksService();

// GET /api/webhooks - Listar histórico
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.oderId; // Pegando do token JWT validado
    const { limit, offset } = req.query;

    const history = await webhooksService.getHistory(
      userId, 
      Number(limit) || 20, 
      Number(offset) || 0
    );

    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar histórico de webhooks' });
  }
});

// POST /api/webhooks/:id/retry - Reenviar manualmente
router.post('/:id/retry', async (req: any, res) => {
  try {
    const userId = req.user.oderId;
    const eventId = req.params.id;

    const event = await webhooksService.retryEvent(eventId, userId);
    
    return res.json({ message: 'Reenvio iniciado', event });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// (Opcional) POST /api/webhooks/test - Rota para o usuário testar a URL dele
router.post('/test', async (req: any, res) => {
  try {
    const userId = req.user.oderId;
    // Dispara um evento fake
    await webhooksService.triggerEvent(userId, 'usage.threshold_reached', {
      message: 'This is a test event triggered by the user.'
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Falha no teste.' });
  }
});

export default router;