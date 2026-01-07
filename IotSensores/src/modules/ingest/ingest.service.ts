import { logger } from '../../shared/logger/index.js';
import { publishToQueue, QUEUES } from '../../shared/queue/index.js';
import { ValidationError, NotFoundError } from '../../shared/errors/index.js';
import { SensorRepository } from '../sensor/sensor.repository.js';
import { IngestPayload, validateIngestPayload } from './ingest.validator.js';

export interface QueuedReading {
  serial_number: string;
  sensor_id: string;
  tenant_id: string;
  temperature: number;
  humidity: number;
  battery_level: string;
  received_at: string;
}

export class IngestService {
  private sensorRepository: SensorRepository;

  constructor() {
    this.sensorRepository = new SensorRepository();
  }

  async processIngest(payload: unknown): Promise<{ received: true; timestamp: string }> {
    // Validate payload
    const validation = validateIngestPayload(payload);
    if (!validation.success) {
      throw new ValidationError(validation.error!);
    }

    const data = validation.data!;

    // Find sensor by serial number
    const sensor = await this.sensorRepository.findBySerialNumber(data.serial_number);
    if (!sensor) {
      throw new NotFoundError(`Sensor with serial_number '${data.serial_number}'`);
    }

    if (!sensor.is_active) {
      throw new ValidationError(`Sensor '${data.serial_number}' is not active`);
    }

    // Create message with server timestamp
    const receivedAt = new Date().toISOString();
    const queuedReading: QueuedReading = {
      serial_number: data.serial_number,
      sensor_id: sensor.id,
      tenant_id: sensor.tenant_id,
      temperature: data.temperature,
      humidity: data.humidity,
      battery_level: data.battery_level,
      received_at: receivedAt,
    };

    // Enqueue for processing
    await publishToQueue(QUEUES.READINGS_PROCESS, queuedReading);

    logger.info(
      {
        serialNumber: data.serial_number,
        tenantId: sensor.tenant_id,
        temperature: data.temperature,
        humidity: data.humidity,
      },
      'Reading enqueued for processing'
    );

    return { received: true, timestamp: receivedAt };
  }
}
