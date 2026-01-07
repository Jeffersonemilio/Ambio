import cron from 'node-cron';
import { logger } from '../shared/logger/index.js';
import { config } from '../config/index.js';
import { query } from '../shared/database/index.js';
import { AlertRepository } from '../modules/alert/alert.repository.js';
import { publishToQueue, QUEUES } from '../shared/queue/index.js';

interface OfflineSensor {
  id: string;
  tenant_id: string;
  serial_number: string;
  name: string;
  last_reading_at: Date | null;
}

export class OfflineSensorChecker {
  private alertRepository: AlertRepository;
  private isRunning = false;

  constructor() {
    this.alertRepository = new AlertRepository();
  }

  async checkOfflineSensors(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Offline sensor check already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      const thresholdMinutes = config.alerts.sensorOfflineThreshold;
      const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);

      logger.debug({ threshold, thresholdMinutes }, 'Checking for offline sensors');

      // Find sensors that haven't sent data in threshold time
      const result = await query<OfflineSensor>(
        `SELECT id, tenant_id, serial_number, name, last_reading_at
         FROM sensors
         WHERE is_active = true
         AND (last_reading_at IS NULL OR last_reading_at < $1)`,
        [threshold]
      );

      const offlineSensors = result.rows;

      if (offlineSensors.length === 0) {
        logger.debug('No offline sensors found');
        return;
      }

      logger.info({ count: offlineSensors.length }, 'Found offline sensors');

      for (const sensor of offlineSensors) {
        // Check if there's already an open offline alert for this sensor
        const existingAlert = await this.alertRepository.findOpenBySensor(
          sensor.id,
          'SENSOR_OFFLINE'
        );

        if (existingAlert) {
          logger.debug(
            { sensorId: sensor.id, alertId: existingAlert.id },
            'Offline alert already exists'
          );
          continue;
        }

        // Create new offline alert
        const alert = await this.alertRepository.create({
          tenant_id: sensor.tenant_id,
          sensor_id: sensor.id,
          type: 'SENSOR_OFFLINE',
          severity: 'WARNING',
          title: `Sensor ${sensor.name} offline`,
          message: `O sensor não envia dados há mais de ${thresholdMinutes} minutos. Última leitura: ${
            sensor.last_reading_at
              ? new Date(sensor.last_reading_at).toLocaleString('pt-BR')
              : 'nunca'
          }`,
          metadata: {
            serial_number: sensor.serial_number,
            last_reading_at: sensor.last_reading_at,
            threshold_minutes: thresholdMinutes,
          },
        });

        // Enqueue notification
        await publishToQueue(QUEUES.NOTIFICATIONS_SEND, {
          alertId: alert.id,
          tenantId: alert.tenant_id,
        });

        logger.info(
          {
            alertId: alert.id,
            sensorId: sensor.id,
            sensorName: sensor.name,
          },
          'Created offline sensor alert'
        );
      }
    } catch (error) {
      logger.error({ error }, 'Error checking offline sensors');
    } finally {
      this.isRunning = false;
    }
  }

  async autoResolveOnlineAlerts(sensorId: string): Promise<void> {
    // When a sensor sends data, resolve any open offline alerts
    const existingAlert = await this.alertRepository.findOpenBySensor(sensorId, 'SENSOR_OFFLINE');

    if (existingAlert) {
      await this.alertRepository.resolve(existingAlert.id);
      logger.info(
        { alertId: existingAlert.id, sensorId },
        'Auto-resolved offline alert - sensor is back online'
      );
    }
  }

  start(cronExpression = '*/5 * * * *'): void {
    // Run every 5 minutes by default
    cron.schedule(cronExpression, async () => {
      await this.checkOfflineSensors();
    });

    logger.info({ cronExpression }, 'Offline sensor checker scheduled');
  }
}
