const notificationsRepository = require('./notifications.repository');
const channelRegistry = require('./channel.registry');
const systemSettingsService = require('../system-settings/system-settings.service');
const { query } = require('../../database');

class NotificationsService {
  /**
   * Envia notificacoes de alerta para todos os usuarios da empresa
   * @param {Object} alert - Dados do alerta
   * @returns {Promise<{sent: number, failed: number, skipped: number}>}
   */
  async sendAlertNotifications(alert) {
    const policy = await systemSettingsService.getNotificationPolicy();
    const enabledChannels = channelRegistry.getEnabled(policy.enabled_channels);

    if (enabledChannels.length === 0) {
      console.warn('[Notifications] Nenhum canal de notificacao habilitado');
      return { sent: 0, failed: 0, skipped: 0 };
    }

    // Buscar usuarios ativos da empresa
    const recipients = await this.getActiveUsersForCompany(alert.company_id);

    if (recipients.length === 0) {
      console.warn(`[Notifications] Nenhum usuario ativo na empresa ${alert.company_id}`);
      return { sent: 0, failed: 0, skipped: 0 };
    }

    const results = { sent: 0, failed: 0, skipped: 0 };
    const attemptNumber = alert.notification_count + 1;

    for (const channel of enabledChannels) {
      for (const user of recipients) {
        try {
          const result = await this.sendToUser(alert, user, channel, attemptNumber);
          if (result.status === 'sent') {
            results.sent++;
          } else if (result.status === 'failed') {
            results.failed++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          console.error(`[Notifications] Erro ao enviar para ${user.email}:`, error.message);
          results.failed++;
        }
      }
    }

    return results;
  }

  /**
   * Envia notificacao para um usuario especifico via um canal
   * @param {Object} alert - Dados do alerta
   * @param {Object} user - Usuario destinatario
   * @param {BaseNotificationChannel} channel - Canal de notificacao
   * @param {number} attemptNumber - Numero da tentativa
   * @returns {Promise<{status: 'sent'|'failed'|'skipped', attemptId: string}>}
   */
  async sendToUser(alert, user, channel, attemptNumber) {
    // Verificar se canal esta disponivel para o usuario
    if (!channel.isAvailableForUser(user)) {
      console.log(`[Notifications] Canal ${channel.name} nao disponivel para ${user.email}`);
      return { status: 'skipped', attemptId: null };
    }

    const recipientAddress = channel.getRecipientAddress(user);

    // Criar registro da tentativa
    const attempt = await notificationsRepository.create({
      alertId: alert.id,
      recipientId: user.id,
      channel: channel.name,
      recipientAddress,
      attemptNumber,
    });

    try {
      // Enviar notificacao
      const result = await channel.sendWithTracking(alert, user);

      if (result.success) {
        await notificationsRepository.markSent(attempt.id, result.providerResponse);
        console.log(`[Notifications] Enviado via ${channel.name} para ${recipientAddress}`);
        return { status: 'sent', attemptId: attempt.id };
      } else {
        await notificationsRepository.markFailed(attempt.id, result.error);
        console.warn(`[Notifications] Falha via ${channel.name} para ${recipientAddress}: ${result.error}`);
        return { status: 'failed', attemptId: attempt.id };
      }
    } catch (error) {
      await notificationsRepository.markFailed(attempt.id, error.message);
      console.error(`[Notifications] Erro via ${channel.name} para ${recipientAddress}:`, error.message);
      return { status: 'failed', attemptId: attempt.id };
    }
  }

  /**
   * Busca usuarios ativos de uma empresa
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Array>}
   */
  async getActiveUsersForCompany(companyId) {
    const result = await query(
      `SELECT id, email, name, phone
       FROM users
       WHERE company_id = $1
         AND is_active = true
         AND user_type = 'company'
       ORDER BY name`,
      [companyId]
    );
    return result.rows;
  }

  /**
   * Calcula proximo horario de notificacao baseado na politica
   * @param {number} currentAttempt - Tentativa atual
   * @returns {Promise<Date|null>}
   */
  async calculateNextNotificationTime(currentAttempt) {
    const policy = await systemSettingsService.getNotificationPolicy();

    if (currentAttempt >= policy.max_attempts) {
      return null; // Esgotado
    }

    const nextTime = new Date();
    nextTime.setMinutes(nextTime.getMinutes() + policy.retry_interval_minutes);
    return nextTime;
  }

  /**
   * Verifica se deve continuar enviando notificacoes
   * @param {Object} alert - Dados do alerta
   * @returns {Promise<boolean>}
   */
  async shouldRetry(alert) {
    const policy = await systemSettingsService.getNotificationPolicy();
    return alert.notification_count < policy.max_attempts;
  }

  // === Queries ===

  async findByAlert(alertId) {
    return notificationsRepository.findByAlert(alertId);
  }

  async findByRecipient(userId, pagination) {
    return notificationsRepository.findByRecipient(userId, pagination);
  }

  async getDeliveryStats(dateRange) {
    return notificationsRepository.getDeliveryStats(dateRange);
  }

  // === Canal Registry ===

  getChannelRegistry() {
    return channelRegistry;
  }

  getEnabledChannels() {
    return systemSettingsService.getNotificationPolicy()
      .then(policy => policy.enabled_channels);
  }
}

module.exports = new NotificationsService();
