const BaseNotificationChannel = require('./base.channel');
const emailService = require('../../email');

/**
 * Canal de notificacao por Email
 * Utiliza o EmailService existente (useSend)
 */
class EmailChannel extends BaseNotificationChannel {
  constructor() {
    super('email');
  }

  getRecipientAddress(user) {
    return user.email;
  }

  isAvailableForUser(user) {
    return !!user.email && user.is_active;
  }

  async send(alert, recipient) {
    const template = this.buildTemplate(alert, recipient);

    const result = await emailService.send({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      throw new Error(result.error || 'Falha ao enviar email');
    }

    return result;
  }

  buildTemplate(alert, recipient) {
    const violationLabel = this.formatViolationType(alert.violation_type);
    const actualValue = this.formatValue(alert.violation_type, alert.actual_value);
    const thresholdValue = this.formatValue(alert.violation_type, alert.threshold_value);
    const sensorName = alert.sensor_name || alert.sensor_serial || 'Sensor';
    const location = alert.sensor_location || 'Localizacao nao especificada';
    const triggeredAt = new Date(alert.triggered_at).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const subject = `[ALERTA] ${sensorName} - ${violationLabel}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
    .footer { background: #e9ecef; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
    .alert-box { background: white; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
    .label { font-weight: bold; color: #495057; }
    .value { color: #212529; }
    .critical { color: #dc3545; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Alerta de Sensor</h2>
    </div>
    <div class="content">
      <p>Ola, <strong>${recipient.name || 'Usuario'}</strong>,</p>
      <p>Foi detectada uma violacao de limite em um de seus sensores:</p>

      <div class="alert-box">
        <p><span class="label">Sensor:</span> <span class="value">${sensorName}</span></p>
        <p><span class="label">Localizacao:</span> <span class="value">${location}</span></p>
        <p><span class="label">Tipo de Violacao:</span> <span class="value">${violationLabel}</span></p>
        <p><span class="label">Valor Lido:</span> <span class="critical">${actualValue}</span></p>
        <p><span class="label">Limite Configurado:</span> <span class="value">${thresholdValue}</span></p>
        <p><span class="label">Data/Hora:</span> <span class="value">${triggeredAt}</span></p>
      </div>

      <p>Por favor, verifique o sensor e tome as medidas necessarias.</p>
      <p>Este e o alerta ${alert.notification_count + 1} de 3 para este evento.</p>
    </div>
    <div class="footer">
      <p>Esta e uma mensagem automatica do sistema Ambio. Por favor, nao responda a este email.</p>
      <p>Empresa: ${alert.company_name || 'N/A'}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
ALERTA DE SENSOR - ${sensorName}

Ola, ${recipient.name || 'Usuario'},

Foi detectada uma violacao de limite:

Sensor: ${sensorName}
Localizacao: ${location}
Tipo: ${violationLabel}
Valor Lido: ${actualValue}
Limite: ${thresholdValue}
Data/Hora: ${triggeredAt}

Por favor, verifique o sensor e tome as medidas necessarias.

Este e o alerta ${alert.notification_count + 1} de 3 para este evento.

---
Sistema Ambio - Mensagem automatica
Empresa: ${alert.company_name || 'N/A'}
    `.trim();

    return { subject, html, text };
  }
}

module.exports = EmailChannel;
