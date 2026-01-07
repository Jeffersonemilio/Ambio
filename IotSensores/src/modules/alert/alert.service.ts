import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
import { logger } from '../../shared/logger/index.js';
import { Alert, CreateAlertDTO, AlertFilters, AlertType } from './alert.entity.js';
import { AlertRepository } from './alert.repository.js';

export class AlertService {
  constructor(private readonly repository: AlertRepository) {}

  async findById(id: string): Promise<Alert> {
    const alert = await this.repository.findById(id);
    if (!alert) {
      throw new NotFoundError('Alert');
    }
    return alert;
  }

  async findAll(filters: AlertFilters = {}): Promise<Alert[]> {
    return this.repository.findAll(filters);
  }

  async findOpen(tenant_id?: string): Promise<Alert[]> {
    return this.repository.findOpen(tenant_id);
  }

  async findOpenBySensor(sensor_id: string, type?: AlertType): Promise<Alert | null> {
    return this.repository.findOpenBySensor(sensor_id, type);
  }

  async findBySensorId(sensor_id: string, limit = 100): Promise<Alert[]> {
    return this.repository.findBySensorId(sensor_id, limit);
  }

  async findByTenantId(tenant_id: string, limit = 100): Promise<Alert[]> {
    return this.repository.findByTenantId(tenant_id, limit);
  }

  async create(data: CreateAlertDTO): Promise<Alert> {
    const alert = await this.repository.create(data);
    logger.info(
      {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        sensorId: alert.sensor_id,
        tenantId: alert.tenant_id,
      },
      'Alert created'
    );
    return alert;
  }

  async acknowledge(id: string, userId: string): Promise<Alert> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Alert');
    }

    if (existing.status === 'RESOLVED') {
      throw new ValidationError('Cannot acknowledge a resolved alert');
    }

    const alert = await this.repository.acknowledge(id, userId);
    logger.info({ alertId: id, userId }, 'Alert acknowledged');
    return alert;
  }

  async resolve(id: string): Promise<Alert> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Alert');
    }

    if (existing.status === 'RESOLVED') {
      throw new ValidationError('Alert is already resolved');
    }

    const alert = await this.repository.resolve(id);
    logger.info({ alertId: id }, 'Alert resolved');
    return alert;
  }

  async resolveOpenBySensor(sensor_id: string, type: AlertType): Promise<void> {
    await this.repository.resolveOpenBySensor(sensor_id, type);
    logger.debug({ sensorId: sensor_id, type }, 'Open alerts resolved for sensor');
  }

  async countByStatus(tenant_id: string) {
    return this.repository.countByStatus(tenant_id);
  }
}
