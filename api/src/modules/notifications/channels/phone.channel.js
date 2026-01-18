const BaseNotificationChannel = require('./base.channel');

/**
 * Canal de notificacao por Ligacao Telefonica
 * PLACEHOLDER - Implementacao futura
 */
class PhoneChannel extends BaseNotificationChannel {
  constructor(provider = null) {
    super('phone');
    this.provider = provider;
  }

  getRecipientAddress(user) {
    return user.phone || null;
  }

  isAvailableForUser(user) {
    return !!user.phone && user.is_active && user.phone_notifications_enabled;
  }

  async send(alert, recipient) {
    if (!this.provider) {
      throw new Error('Provedor de ligacao nao configurado');
    }

    const message = this.buildVoiceMessage(alert);

    // Implementacao futura - usar TTS (text-to-speech)
    // return this.provider.call(recipient.phone, message);

    throw new Error('Canal de ligacao ainda nao implementado');
  }

  buildVoiceMessage(alert) {
    const violationLabel = this.formatViolationType(alert.violation_type);
    const actualValue = this.formatValue(alert.violation_type, alert.actual_value);
    const sensorName = alert.sensor_name || alert.sensor_serial || 'Sensor';

    // Mensagem otimizada para TTS
    return `Atencao. Alerta do sistema Ambio. O sensor ${sensorName} apresentou ${violationLabel}. O valor lido foi ${actualValue}. Por favor, verifique imediatamente.`;
  }
}

module.exports = PhoneChannel;
