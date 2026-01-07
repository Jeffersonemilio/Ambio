import { ConsumeMessage } from 'amqplib';
import { logger } from '../../shared/logger/index.js';
import { consumeQueue, publishToQueue, QUEUES } from '../../shared/queue/index.js';
import { ReadingService } from '../reading/reading.service.js';
import { ReadingRepository } from '../reading/reading.repository.js';
import { SensorRepository } from '../sensor/sensor.repository.js';
import { RulesEngineService } from '../alert/rules-engine.service.js';
import { QueuedReading } from './ingest.service.js';
import { BatteryLevel } from '../reading/reading.entity.js';

export class ReadingConsumer {
  private readingService: ReadingService;
  private sensorRepository: SensorRepository;
  private rulesEngine: RulesEngineService;

  constructor() {
    this.readingService = new ReadingService(new ReadingRepository());
    this.sensorRepository = new SensorRepository();
    this.rulesEngine = new RulesEngineService();
  }

  async start(): Promise<void> {
    logger.info('Starting reading consumer...');

    await consumeQueue(
      QUEUES.READINGS_PROCESS,
      async (msg: ConsumeMessage) => {
        await this.processMessage(msg);
      },
      { prefetch: 10 }
    );

    logger.info('Reading consumer started');
  }

  private async processMessage(msg: ConsumeMessage): Promise<void> {
    const content = msg.content.toString();
    let data: QueuedReading;

    try {
      data = JSON.parse(content);
    } catch {
      logger.error({ content }, 'Failed to parse message');
      throw new Error('Invalid JSON in message');
    }

    logger.debug({ data }, 'Processing reading');

    // 1. Create reading in database
    const reading = await this.readingService.create({
      sensor_id: data.sensor_id,
      tenant_id: data.tenant_id,
      serial_number: data.serial_number,
      temperature: data.temperature,
      humidity: data.humidity,
      battery_level: data.battery_level as BatteryLevel,
    });

    // 2. Update sensor's last_reading_at
    await this.sensorRepository.updateLastReadingAt(data.sensor_id);

    // 3. Evaluate rules and create alerts
    const alerts = await this.rulesEngine.evaluate(reading);

    // 4. Enqueue notifications for each alert
    for (const alert of alerts) {
      await publishToQueue(QUEUES.NOTIFICATIONS_SEND, {
        alertId: alert.id,
        tenantId: alert.tenant_id,
      });
    }

    logger.info(
      {
        readingId: reading.id,
        sensorId: data.sensor_id,
        tenantId: data.tenant_id,
        temperature: data.temperature,
        humidity: data.humidity,
        alertsCreated: alerts.length,
      },
      'Reading processed and persisted'
    );
  }
}
