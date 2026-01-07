import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/database/index.js';
import { Alert, CreateAlertDTO, AlertFilters, AlertType, AlertStatus } from './alert.entity.js';

export class AlertRepository {
  async findById(id: string): Promise<Alert | null> {
    const result = await query<Alert>('SELECT * FROM alerts WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findAll(filters: AlertFilters = {}): Promise<Alert[]> {
    let sql = 'SELECT * FROM alerts WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.tenant_id) {
      sql += ` AND tenant_id = $${paramIndex++}`;
      params.push(filters.tenant_id);
    }

    if (filters.sensor_id) {
      sql += ` AND sensor_id = $${paramIndex++}`;
      params.push(filters.sensor_id);
    }

    if (filters.type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(filters.type);
    }

    if (filters.severity) {
      sql += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    if (filters.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.start_date) {
      sql += ` AND triggered_at >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND triggered_at <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    sql += ' ORDER BY triggered_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await query<Alert>(sql, params);
    return result.rows;
  }

  async findOpen(tenant_id?: string): Promise<Alert[]> {
    let sql = "SELECT * FROM alerts WHERE status = 'OPEN'";
    const params: unknown[] = [];

    if (tenant_id) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    }

    sql += ' ORDER BY triggered_at DESC';

    const result = await query<Alert>(sql, params);
    return result.rows;
  }

  async findOpenBySensor(sensor_id: string, type?: AlertType): Promise<Alert | null> {
    let sql = "SELECT * FROM alerts WHERE sensor_id = $1 AND status = 'OPEN'";
    const params: unknown[] = [sensor_id];

    if (type) {
      sql += ' AND type = $2';
      params.push(type);
    }

    sql += ' ORDER BY triggered_at DESC LIMIT 1';

    const result = await query<Alert>(sql, params);
    return result.rows[0] || null;
  }

  async findBySensorId(sensor_id: string, limit = 100): Promise<Alert[]> {
    const result = await query<Alert>(
      'SELECT * FROM alerts WHERE sensor_id = $1 ORDER BY triggered_at DESC LIMIT $2',
      [sensor_id, limit]
    );
    return result.rows;
  }

  async findByTenantId(tenant_id: string, limit = 100): Promise<Alert[]> {
    const result = await query<Alert>(
      'SELECT * FROM alerts WHERE tenant_id = $1 ORDER BY triggered_at DESC LIMIT $2',
      [tenant_id, limit]
    );
    return result.rows;
  }

  async create(data: CreateAlertDTO): Promise<Alert> {
    const id = uuidv4();
    const result = await query<Alert>(
      `INSERT INTO alerts (id, tenant_id, sensor_id, reading_id, rule_id, type, severity, status, title, message, value, threshold, triggered_at, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', $8, $9, $10, $11, NOW(), $12, NOW(), NOW())
       RETURNING *`,
      [
        id,
        data.tenant_id,
        data.sensor_id,
        data.reading_id || null,
        data.rule_id || null,
        data.type,
        data.severity,
        data.title,
        data.message || null,
        data.value ?? null,
        data.threshold ?? null,
        data.metadata || {},
      ]
    );
    return result.rows[0];
  }

  async acknowledge(id: string, userId: string): Promise<Alert> {
    const result = await query<Alert>(
      `UPDATE alerts
       SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), acknowledged_by = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  }

  async resolve(id: string): Promise<Alert> {
    const result = await query<Alert>(
      `UPDATE alerts
       SET status = 'RESOLVED', resolved_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async resolveOpenBySensor(sensor_id: string, type: AlertType): Promise<void> {
    await query(
      `UPDATE alerts
       SET status = 'RESOLVED', resolved_at = NOW(), updated_at = NOW()
       WHERE sensor_id = $1 AND type = $2 AND status IN ('OPEN', 'ACKNOWLEDGED')`,
      [sensor_id, type]
    );
  }

  async countByStatus(tenant_id: string): Promise<Record<AlertStatus, number>> {
    const result = await query<{ status: AlertStatus; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM alerts
       WHERE tenant_id = $1
       GROUP BY status`,
      [tenant_id]
    );

    const counts: Record<AlertStatus, number> = {
      OPEN: 0,
      ACKNOWLEDGED: 0,
      RESOLVED: 0,
    };

    for (const row of result.rows) {
      counts[row.status] = parseInt(row.count, 10);
    }

    return counts;
  }
}
