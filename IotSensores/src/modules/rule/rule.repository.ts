import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/database/index.js';
import { Rule, CreateRuleDTO, UpdateRuleDTO, RuleFilters } from './rule.entity.js';

export class RuleRepository {
  async findById(id: string): Promise<Rule | null> {
    const result = await query<Rule>('SELECT * FROM rules WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findAll(filters: RuleFilters = {}): Promise<Rule[]> {
    let sql = 'SELECT * FROM rules WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.tenant_id) {
      sql += ` AND tenant_id = $${paramIndex++}`;
      params.push(filters.tenant_id);
    }

    if (filters.sensor_id) {
      sql += ` AND (sensor_id = $${paramIndex++} OR sensor_id IS NULL)`;
      params.push(filters.sensor_id);
    }

    if (filters.type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(filters.type);
    }

    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex++}`;
      params.push(filters.is_active);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query<Rule>(sql, params);
    return result.rows;
  }

  async findByTenantId(tenant_id: string): Promise<Rule[]> {
    const result = await query<Rule>(
      'SELECT * FROM rules WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenant_id]
    );
    return result.rows;
  }

  async findBySensorId(sensor_id: string, tenant_id: string): Promise<Rule[]> {
    const result = await query<Rule>(
      `SELECT * FROM rules
       WHERE tenant_id = $1
       AND (sensor_id = $2 OR sensor_id IS NULL)
       AND is_active = true
       ORDER BY sensor_id NULLS LAST, created_at DESC`,
      [tenant_id, sensor_id]
    );
    return result.rows;
  }

  async findActiveByTenant(tenant_id: string): Promise<Rule[]> {
    const result = await query<Rule>(
      'SELECT * FROM rules WHERE tenant_id = $1 AND is_active = true ORDER BY created_at DESC',
      [tenant_id]
    );
    return result.rows;
  }

  async create(data: CreateRuleDTO): Promise<Rule> {
    const id = uuidv4();
    const result = await query<Rule>(
      `INSERT INTO rules (id, tenant_id, sensor_id, name, type, condition, threshold_min, threshold_max, severity, is_active, cooldown_minutes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW(), NOW())
       RETURNING *`,
      [
        id,
        data.tenant_id,
        data.sensor_id || null,
        data.name,
        data.type,
        data.condition,
        data.threshold_min ?? null,
        data.threshold_max ?? null,
        data.severity || 'WARNING',
        data.cooldown_minutes || 30,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, data: UpdateRuleDTO): Promise<Rule> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.condition !== undefined) {
      fields.push(`condition = $${paramIndex++}`);
      values.push(data.condition);
    }
    if (data.threshold_min !== undefined) {
      fields.push(`threshold_min = $${paramIndex++}`);
      values.push(data.threshold_min);
    }
    if (data.threshold_max !== undefined) {
      fields.push(`threshold_max = $${paramIndex++}`);
      values.push(data.threshold_max);
    }
    if (data.severity !== undefined) {
      fields.push(`severity = $${paramIndex++}`);
      values.push(data.severity);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }
    if (data.cooldown_minutes !== undefined) {
      fields.push(`cooldown_minutes = $${paramIndex++}`);
      values.push(data.cooldown_minutes);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<Rule>(
      `UPDATE rules SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    await query('UPDATE rules SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
  }
}
