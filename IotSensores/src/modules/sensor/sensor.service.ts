import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { logger } from '../../shared/logger/index.js';
import { Sensor, CreateSensorDTO, UpdateSensorDTO } from './sensor.entity.js';
import { SensorRepository } from './sensor.repository.js';

export class SensorService {
  constructor(private readonly repository: SensorRepository) {}

  async findById(id: string): Promise<Sensor> {
    const sensor = await this.repository.findById(id);
    if (!sensor) {
      throw new NotFoundError('Sensor');
    }
    return sensor;
  }

  async findAll(filters?: { tenant_id?: string; is_active?: boolean }): Promise<Sensor[]> {
    return this.repository.findAll(filters);
  }

  async findBySerialNumber(serial_number: string): Promise<Sensor> {
    const sensor = await this.repository.findBySerialNumber(serial_number);
    if (!sensor) {
      throw new NotFoundError('Sensor');
    }
    return sensor;
  }

  async findByTenantId(tenant_id: string): Promise<Sensor[]> {
    return this.repository.findByTenantId(tenant_id);
  }

  async create(data: CreateSensorDTO): Promise<Sensor> {
    // Check for duplicate serial number
    const existingBySerial = await this.repository.findBySerialNumber(data.serial_number);
    if (existingBySerial) {
      throw new ConflictError('A sensor with this serial number already exists');
    }

    const sensor = await this.repository.create(data);
    logger.info({ sensorId: sensor.id, serialNumber: sensor.serial_number }, 'Sensor created');
    return sensor;
  }

  async update(id: string, data: UpdateSensorDTO): Promise<Sensor> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Sensor');
    }

    const sensor = await this.repository.update(id, data);
    logger.info({ sensorId: sensor.id }, 'Sensor updated');
    return sensor;
  }

  async updateLastReadingAt(id: string): Promise<void> {
    await this.repository.updateLastReadingAt(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Sensor');
    }

    await this.repository.delete(id);
    logger.info({ sensorId: id }, 'Sensor deactivated');
  }
}
