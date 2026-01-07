import { ConsumeMessage } from 'amqplib';
import { logger } from '../../shared/logger/index.js';
import { consumeQueue, QUEUES } from '../../shared/queue/index.js';
import { AlertRepository } from '../alert/alert.repository.js';
import { SensorRepository } from '../sensor/sensor.repository.js';
import { TenantRepository } from '../tenant/tenant.repository.js';
import { NotificationService } from './notification.service.js';

export interface NotificationMessage {
  alertId: string;
  tenantId: string;
}

export class NotificationConsumer {
  private notificationService: NotificationService;
  private alertRepository: AlertRepository;
  private sensorRepository: SensorRepository;
  private tenantRepository: TenantRepository;

  constructor() {
    this.notificationService = new NotificationService();
    this.alertRepository = new AlertRepository();
    this.sensorRepository = new SensorRepository();
    this.tenantRepository = new TenantRepository();
  }

  async start(): Promise<void> {
    logger.info('Starting notification consumer...');

    await consumeQueue(
      QUEUES.NOTIFICATIONS_SEND,
      async (msg: ConsumeMessage) => {
        await this.processMessage(msg);
      },
      { prefetch: 5 }
    );

    logger.info('Notification consumer started');
  }

  private async processMessage(msg: ConsumeMessage): Promise<void> {
    const content = msg.content.toString();
    let data: NotificationMessage;

    try {
      data = JSON.parse(content);
    } catch {
      logger.error({ content }, 'Failed to parse notification message');
      throw new Error('Invalid JSON in message');
    }

    logger.debug({ data }, 'Processing notification');

    // Get alert details
    const alert = await this.alertRepository.findById(data.alertId);
    if (!alert) {
      logger.warn({ alertId: data.alertId }, 'Alert not found for notification');
      return;
    }

    // Get sensor details
    const sensor = await this.sensorRepository.findById(alert.sensor_id);
    if (!sensor) {
      logger.warn({ sensorId: alert.sensor_id }, 'Sensor not found for notification');
      return;
    }

    // Get tenant details
    const tenant = await this.tenantRepository.findById(data.tenantId);
    if (!tenant) {
      logger.warn({ tenantId: data.tenantId }, 'Tenant not found for notification');
      return;
    }

    // Send notification
    await this.notificationService.sendAlertNotification(alert, sensor, tenant);

    logger.info(
      { alertId: alert.id, tenantId: tenant.id },
      'Notification processed'
    );
  }
}
