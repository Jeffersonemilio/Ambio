import Handlebars from 'handlebars';
import { Alert } from '../alert/alert.entity.js';

const alertTemplate = Handlebars.compile(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header.critical { background-color: #dc3545; color: white; }
    .header.warning { background-color: #ffc107; color: #333; }
    .header.info { background-color: #17a2b8; color: white; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .details { background-color: white; padding: 15px; border-radius: 4px; margin-top: 15px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header {{severityClass}}">
      <h1>{{title}}</h1>
      <p>{{severityLabel}}</p>
    </div>
    <div class="content">
      <p>{{message}}</p>
      <div class="details">
        <div class="detail-row">
          <span class="label">Sensor:</span>
          <span class="value">{{sensorName}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Valor:</span>
          <span class="value">{{value}} {{unit}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Limite:</span>
          <span class="value">{{threshold}} {{unit}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Data/Hora:</span>
          <span class="value">{{triggeredAt}}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Este é um e-mail automático do sistema de monitoramento IoT.</p>
      <p>Não responda a este e-mail.</p>
    </div>
  </div>
</body>
</html>
`);

export interface AlertTemplateData {
  title: string;
  message: string;
  severity: string;
  sensorName: string;
  value: number | null;
  threshold: number | null;
  triggeredAt: string;
  type: string;
}

export function renderAlertEmail(alert: Alert, sensorName: string): string {
  const severityLabels = {
    CRITICAL: 'Alerta Crítico',
    WARNING: 'Aviso',
    INFO: 'Informação',
  };

  const typeUnits: Record<string, string> = {
    TEMPERATURE_HIGH: '°C',
    TEMPERATURE_LOW: '°C',
    HUMIDITY_HIGH: '%',
    HUMIDITY_LOW: '%',
    BATTERY_LOW: '%',
    BATTERY_CRITICAL: '%',
    SENSOR_OFFLINE: '',
  };

  return alertTemplate({
    title: alert.title,
    message: alert.message || '',
    severityClass: alert.severity.toLowerCase(),
    severityLabel: severityLabels[alert.severity] || alert.severity,
    sensorName,
    value: alert.value,
    threshold: alert.threshold,
    unit: typeUnits[alert.type] || '',
    triggeredAt: new Date(alert.triggered_at).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    }),
  });
}
