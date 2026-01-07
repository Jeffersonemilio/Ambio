import { logger } from '../../shared/logger/index.js';
import { Reading, CreateReadingDTO, ReadingFilters } from './reading.entity.js';
import { ReadingRepository } from './reading.repository.js';

export class ReadingService {
  constructor(private readonly repository: ReadingRepository) {}

  async findById(id: string): Promise<Reading | null> {
    return this.repository.findById(id);
  }

  async findAll(filters: ReadingFilters = {}): Promise<Reading[]> {
    return this.repository.findAll(filters);
  }

  async findBySensorId(sensor_id: string, limit = 100): Promise<Reading[]> {
    return this.repository.findBySensorId(sensor_id, limit);
  }

  async findByTenantId(tenant_id: string, limit = 100): Promise<Reading[]> {
    return this.repository.findByTenantId(tenant_id, limit);
  }

  async findLatestBySensorId(sensor_id: string): Promise<Reading | null> {
    return this.repository.findLatestBySensorId(sensor_id);
  }

  async create(data: CreateReadingDTO): Promise<Reading> {
    const reading = await this.repository.create(data);
    logger.debug(
      { readingId: reading.id, sensorId: reading.sensor_id, tenantId: reading.tenant_id },
      'Reading created'
    );
    return reading;
  }

  async countByTenantId(tenant_id: string): Promise<number> {
    return this.repository.countByTenantId(tenant_id);
  }

  async countBySensorId(sensor_id: string): Promise<number> {
    return this.repository.countBySensorId(sensor_id);
  }
}
