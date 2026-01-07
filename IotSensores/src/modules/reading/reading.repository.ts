import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/database/index.js';
import { Reading, CreateReadingDTO, ReadingFilters } from './reading.entity.js';

export class ReadingRepository {
  async findById(id: string): Promise<Reading | null> {
    const result = await query<Reading>('SELECT * FROM readings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findAll(filters: ReadingFilters = {}): Promise<Reading[]> {
    let sql = 'SELECT * FROM readings WHERE 1=1';
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

    if (filters.serial_number) {
      sql += ` AND serial_number = $${paramIndex++}`;
      params.push(filters.serial_number);
    }

    if (filters.start_date) {
      sql += ` AND received_at >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND received_at <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    sql += ' ORDER BY received_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await query<Reading>(sql, params);
    return result.rows;
  }

  async findBySensorId(sensor_id: string, limit = 100): Promise<Reading[]> {
    const result = await query<Reading>(
      'SELECT * FROM readings WHERE sensor_id = $1 ORDER BY received_at DESC LIMIT $2',
      [sensor_id, limit]
    );
    return result.rows;
  }

  async findByTenantId(tenant_id: string, limit = 100): Promise<Reading[]> {
    const result = await query<Reading>(
      'SELECT * FROM readings WHERE tenant_id = $1 ORDER BY received_at DESC LIMIT $2',
      [tenant_id, limit]
    );
    return result.rows;
  }

  async findLatestBySensorId(sensor_id: string): Promise<Reading | null> {
    const result = await query<Reading>(
      'SELECT * FROM readings WHERE sensor_id = $1 ORDER BY received_at DESC LIMIT 1',
      [sensor_id]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateReadingDTO): Promise<Reading> {
    const id = uuidv4();
    const result = await query<Reading>(
      `INSERT INTO readings (id, sensor_id, tenant_id, serial_number, temperature, humidity, battery_level, received_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
       RETURNING *`,
      [
        id,
        data.sensor_id,
        data.tenant_id,
        data.serial_number,
        data.temperature,
        data.humidity,
        data.battery_level,
        data.metadata || {},
      ]
    );
    return result.rows[0];
  }

  async countByTenantId(tenant_id: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM readings WHERE tenant_id = $1',
      [tenant_id]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async countBySensorId(sensor_id: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM readings WHERE sensor_id = $1',
      [sensor_id]
    );
    return parseInt(result.rows[0].count, 10);
  }
}
