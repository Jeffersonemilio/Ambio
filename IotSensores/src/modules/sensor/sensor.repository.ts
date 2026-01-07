import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/database/index.js';
import { IRepository } from '../../shared/interfaces/index.js';
import { Sensor, CreateSensorDTO, UpdateSensorDTO } from './sensor.entity.js';

export class SensorRepository implements IRepository<Sensor> {
  async findById(id: string): Promise<Sensor | null> {
    const result = await query<Sensor>('SELECT * FROM sensors WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findAll(filters?: { tenant_id?: string; is_active?: boolean }): Promise<Sensor[]> {
    let sql = 'SELECT * FROM sensors WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.tenant_id) {
      sql += ` AND tenant_id = $${paramIndex++}`;
      params.push(filters.tenant_id);
    }

    if (filters?.is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex++}`;
      params.push(filters.is_active);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query<Sensor>(sql, params);
    return result.rows;
  }

  async findBySerialNumber(serial_number: string): Promise<Sensor | null> {
    const result = await query<Sensor>('SELECT * FROM sensors WHERE serial_number = $1', [
      serial_number,
    ]);
    return result.rows[0] || null;
  }

  async findByTenantId(tenant_id: string): Promise<Sensor[]> {
    const result = await query<Sensor>(
      'SELECT * FROM sensors WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenant_id]
    );
    return result.rows;
  }

  async create(data: CreateSensorDTO): Promise<Sensor> {
    const id = uuidv4();
    const result = await query<Sensor>(
      `INSERT INTO sensors (id, serial_number, tenant_id, name, location, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING *`,
      [id, data.serial_number, data.tenant_id, data.name, data.location]
    );
    return result.rows[0];
  }

  async update(id: string, data: UpdateSensorDTO): Promise<Sensor> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.location !== undefined) {
      fields.push(`location = $${paramIndex++}`);
      values.push(data.location);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<Sensor>(
      `UPDATE sensors SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async updateLastReadingAt(id: string): Promise<void> {
    await query('UPDATE sensors SET last_reading_at = NOW(), updated_at = NOW() WHERE id = $1', [
      id,
    ]);
  }

  async delete(id: string): Promise<void> {
    await query('UPDATE sensors SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
  }
}
