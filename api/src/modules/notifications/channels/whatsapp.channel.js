const BaseNotificationChannel = require('./base.channel');

/**
 * Canal de notificacao por WhatsApp
 * PLACEHOLDER - Implementacao futura
 */
class WhatsAppChannel extends BaseNotificationChannel {
  constructor(provider = null) {
    super('whatsapp');
    this.provider = provider;
  }

  getRecipientAddress(user) {
    return user.whatsapp || user.phone || null;
  }

  isAvailableForUser(user) {
    const hasNumber = !!(user.whatsapp || user.phone);
    return hasNumber && user.is_active && user.whatsapp_notifications_enabled;
  }

  async send(alert, recipient) {
    if (!this.provider) {
      throw new Error('Provedor WhatsApp nao configurado');
    }

    const message = this.buildMessage(alert, recipient);

    // Implementacao futura
    // return this.provider.send(recipient.whatsapp || recipient.phone, message);

    throw new Error('Canal WhatsApp ainda nao implementado');
  }

  buildMessage(alert, recipient) {
    const violationLabel = this.formatViolationType(alert.violation_type);
    const actualValue = this.formatValue(alert.violation_type, alert.actual_value);
    const thresholdValue = this.formatValue(alert.violation_type, alert.threshold_value);
    const sensorName = alert.sensor_name || alert.sensor_serial || 'Sensor';
    const location = alert.sensor_location || 'Nao especificada';

    return `
*ALERTA DE SENSOR*

Ola, ${recipient.name || 'Usuario'}!

Foi detectada uma violacao de limite:

*Sensor:* ${sensorName}
*Local:* ${location}
*Tipo:* ${violationLabel}
*Valor Lido:* ${actualValue}
*Limite:* ${thresholdValue}

Por favor, verifique o sensor.

_Sistema Ambio_
    `.trim();
  }
}

module.exports = WhatsAppChannel;
