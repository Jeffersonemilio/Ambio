import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { logger } from '../../shared/logger/index.js';
import { Tenant, CreateTenantDTO, UpdateTenantDTO } from './tenant.entity.js';
import { TenantRepository } from './tenant.repository.js';

export class TenantService {
  constructor(private readonly repository: TenantRepository) {}

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.repository.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant');
    }
    return tenant;
  }

  async findAll(filters?: { is_active?: boolean }): Promise<Tenant[]> {
    return this.repository.findAll(filters);
  }

  async create(data: CreateTenantDTO): Promise<Tenant> {
    // Check for duplicate document
    const existingByDocument = await this.repository.findByDocument(data.document);
    if (existingByDocument) {
      throw new ConflictError('A tenant with this document already exists');
    }

    // Check for duplicate email
    const existingByEmail = await this.repository.findByEmail(data.email);
    if (existingByEmail) {
      throw new ConflictError('A tenant with this email already exists');
    }

    const tenant = await this.repository.create(data);
    logger.info({ tenantId: tenant.id }, 'Tenant created');
    return tenant;
  }

  async update(id: string, data: UpdateTenantDTO): Promise<Tenant> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Tenant');
    }

    // Check for duplicate document if updating
    if (data.document && data.document !== existing.document) {
      const existingByDocument = await this.repository.findByDocument(data.document);
      if (existingByDocument) {
        throw new ConflictError('A tenant with this document already exists');
      }
    }

    // Check for duplicate email if updating
    if (data.email && data.email !== existing.email) {
      const existingByEmail = await this.repository.findByEmail(data.email);
      if (existingByEmail) {
        throw new ConflictError('A tenant with this email already exists');
      }
    }

    const tenant = await this.repository.update(id, data);
    logger.info({ tenantId: tenant.id }, 'Tenant updated');
    return tenant;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Tenant');
    }

    await this.repository.delete(id);
    logger.info({ tenantId: id }, 'Tenant deactivated');
  }
}
