import { WebhookEventModel } from './webhooks.model';
import type { WebhookEvent } from './webhooks.types';
import { UserModel } from '../users/users.model'; // Importe para pegar a URL do usuário, se estiver lá

export class WebhooksService {
  
  /**
   * Cria um evento e tenta dispará-lo imediatamente.
   * Usado por outros módulos (ex: UsageService chama isso quando o limite estoura).
   */
  async triggerEvent(
    userId: string, 
    eventType: WebhookEvent['eventType'], 
    payload: Record<string, any>
  ) {
    // 1. Cria o registro do evento (status pendente/inicial)
    const event = await WebhookEventModel.create({
      userId,
      eventType,
      payload,
      attempts: 0
    });

    // 2. Tenta enviar (sem await se quiser que seja background, com await se quiser garantir)
    // Recomendado: Background ou Queue (BullMQ). Aqui faremos direto para simplificar.
    this.attemptDelivery(event);

    return event;
  }

  /**
   * Lógica de envio HTTP (Disparo real)
   */
  async attemptDelivery(event: any) {
    try {
      // BUSCAR A URL DO CLIENTE
      // Supondo que você salve a URL no User ou em uma collection separada
      const user = await UserModel.findOne({ oderId: event.userId }); // ou _id dependendo da sua lógica
      
      // MOCK: Se não tiver campo webhookUrl no user, simula erro ou retorna
      const targetUrl = (user as any)?.webhookUrl; 

      if (!targetUrl) {
        throw new Error('Usuário não configurou URL de Webhook.');
      }

      console.log(`🚀 Enviando webhook ${event.eventType} para ${targetUrl}`);

      // Incrementa tentativas
      event.attempts += 1;

      // Dispara request (Bun usa fetch nativo)
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Robin-Wood-Event': event.eventType,
          // 'X-Signature': '...' // Idealmente você assinaria o payload aqui com HMAC
        },
        body: JSON.stringify({
          id: event._id,
          type: event.eventType,
          data: event.payload,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Servidor cliente respondeu com status ${response.status}`);
      }

      // Sucesso
      event.deliveredAt = new Date();
      event.lastError = undefined;
      await event.save();
      console.log(`✅ Webhook entregue: ${event._id}`);

    } catch (error: any) {
      // Falha
      event.failedAt = new Date();
      event.lastError = error.message || 'Erro desconhecido de rede';
      await event.save();
      console.error(`❌ Falha no webhook ${event._id}: ${event.lastError}`);
    }
  }

  /**
   * Lista histórico para o Dashboard do usuário
   */
  async getHistory(userId: string, limit = 20, offset = 0) {
    const events = await WebhookEventModel.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await WebhookEventModel.countDocuments({ userId });

    return { events, total };
  }

  /**
   * Reenviar manualmente (Botão "Retry" no dashboard)
   */
  async retryEvent(eventId: string, userId: string) {
    const event = await WebhookEventModel.findOne({ _id: eventId, userId });
    
    if (!event) throw new Error('Evento não encontrado');

    // Reseta status de falha para tentar de novo
    event.failedAt = undefined; 
    await this.attemptDelivery(event);
    
    return event;
  }
}