import { NotFoundError } from '../../shared/errors/index.js';
import { logger } from '../../shared/logger/index.js';
import { Rule, CreateRuleDTO, UpdateRuleDTO, RuleFilters } from './rule.entity.js';
import { RuleRepository } from './rule.repository.js';

export class RuleService {
  constructor(private readonly repository: RuleRepository) {}

  async findById(id: string): Promise<Rule> {
    const rule = await this.repository.findById(id);
    if (!rule) {
      throw new NotFoundError('Rule');
    }
    return rule;
  }

  async findAll(filters: RuleFilters = {}): Promise<Rule[]> {
    return this.repository.findAll(filters);
  }

  async findByTenantId(tenant_id: string): Promise<Rule[]> {
    return this.repository.findByTenantId(tenant_id);
  }

  async findBySensorId(sensor_id: string, tenant_id: string): Promise<Rule[]> {
    return this.repository.findBySensorId(sensor_id, tenant_id);
  }

  async findActiveByTenant(tenant_id: string): Promise<Rule[]> {
    return this.repository.findActiveByTenant(tenant_id);
  }

  async create(data: CreateRuleDTO): Promise<Rule> {
    const rule = await this.repository.create(data);
    logger.info({ ruleId: rule.id, tenantId: rule.tenant_id }, 'Rule created');
    return rule;
  }

  async update(id: string, data: UpdateRuleDTO): Promise<Rule> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Rule');
    }

    const rule = await this.repository.update(id, data);
    logger.info({ ruleId: rule.id }, 'Rule updated');
    return rule;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Rule');
    }

    await this.repository.delete(id);
    logger.info({ ruleId: id }, 'Rule deactivated');
  }

  async createDefaultRules(tenant_id: string): Promise<Rule[]> {
    const defaultRules: CreateRuleDTO[] = [
      {
        tenant_id,
        name: 'Bateria baixa',
        type: 'BATTERY',
        condition: 'BELOW',
        threshold_min: 30,
        severity: 'WARNING',
        cooldown_minutes: 1440, // 24h
      },
      {
        tenant_id,
        name: 'Bateria crítica',
        type: 'BATTERY',
        condition: 'BELOW',
        threshold_min: 10,
        severity: 'CRITICAL',
        cooldown_minutes: 360, // 6h
      },
    ];

    const createdRules: Rule[] = [];
    for (const ruleData of defaultRules) {
      const rule = await this.repository.create(ruleData);
      createdRules.push(rule);
    }

    logger.info({ tenantId: tenant_id, count: createdRules.length }, 'Default rules created');
    return createdRules;
  }
}
