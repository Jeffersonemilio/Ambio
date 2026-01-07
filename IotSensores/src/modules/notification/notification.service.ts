import { logger } from '../../shared/logger/index.js';
import { Alert } from '../alert/alert.entity.js';
import { Sensor } from '../sensor/sensor.entity.js';
import { Tenant } from '../tenant/tenant.entity.js';
import { Notification } from './notification.entity.js';
import { NotificationLogRepository } from './notification.repository.js';
import { EmailProvider, INotificationProvider } from './email.provider.js';
import { renderAlertEmail } from './templates.js';

export class NotificationService {
  private emailProvider: INotificationProvider;
  private logRepository: NotificationLogRepository;

  constructor() {
    this.emailProvider = new EmailProvider();
    this.logRepository = new NotificationLogRepository();
  }

  async sendAlertNotification(alert: Alert, sensor: Sensor, tenant: Tenant): Promise<void> {
    const recipients = [tenant.email];
    const subject = `[${alert.severity}] ${alert.title} - ${sensor.name}`;
    const body = renderAlertEmail(alert, sensor.name);

    for (const recipient of recipients) {
      await this.send(
        {
          type: 'EMAIL',
          recipient,
          subject,
          body,
          data: { alertId: alert.id, sensorId: sensor.id },
        },
        tenant.id,
        alert.id
      );
    }
  }

  async send(
    notification: Notification,
    tenant_id: string,
    alert_id?: string
  ): Promise<void> {
    // Create log entry
    const log = await this.logRepository.create({
      tenant_id,
      alert_id,
      type: notification.type,
      recipient: notification.recipient,
      subject: notification.subject,
      status: 'PENDING',
    });

    try {
      switch (notification.type) {
        case 'EMAIL':
          await this.emailProvider.send(notification);
          break;
        case 'SMS':
          logger.warn('SMS notifications not implemented yet');
          break;
        case 'PUSH':
          logger.warn('Push notifications not implemented yet');
          break;
      }

      await this.logRepository.updateStatus(log.id, 'SENT');
      logger.info(
        { logId: log.id, type: notification.type, recipient: notification.recipient },
        'Notification sent'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logRepository.updateStatus(log.id, 'FAILED', errorMessage);
      logger.error(
        { logId: log.id, error: errorMessage },
        'Failed to send notification'
      );
    }
  }
}
