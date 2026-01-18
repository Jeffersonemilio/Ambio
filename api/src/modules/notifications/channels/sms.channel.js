const BaseNotificationChannel = require('./base.channel');

/**
 * Canal de notificacao por SMS
 * PLACEHOLDER - Implementacao futura
 */
class SmsChannel extends BaseNotificationChannel {
  constructor(provider = null) {
    super('sms');
    this.provider = provider;
  }

  getRecipientAddress(user) {
    return user.phone || null;
  }

  isAvailableForUser(user) {
    // Requer telefone cadastrado e notificacoes SMS habilitadas
    return !!user.phone && user.is_active && user.sms_notifications_enabled;
  }

  async send(alert, recipient) {
    if (!this.provider) {
      throw new Error('Provedor SMS nao configurado');
    }

    const message = this.buildMessage(alert);

    // Implementacao futura
    // return this.provider.send(recipient.phone, message);

    throw new Error('Canal SMS ainda nao implementado');
  }

  buildMessage(alert) {
    const violationLabel = this.formatViolationType(alert.violation_type);
    const actualValue = this.formatValue(alert.violation_type, alert.actual_value);
    const sensorName = alert.sensor_name || alert.sensor_serial || 'Sensor';

    return `[AMBIO] Alerta: ${sensorName} - ${violationLabel}. Valor: ${actualValue}. Verifique imediatamente.`;
  }
}

module.exports = SmsChannel;
