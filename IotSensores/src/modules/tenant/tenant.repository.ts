import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/database/index.js';
import { IRepository } from '../../shared/interfaces/index.js';
import { Tenant, CreateTenantDTO, UpdateTenantDTO } from './tenant.entity.js';

export class TenantRepository implements IRepository<Tenant> {
  async findById(id: string): Promise<Tenant | null> {
    const result = await query<Tenant>('SELECT * FROM tenants WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findAll(filters?: { is_active?: boolean }): Promise<Tenant[]> {
    let sql = 'SELECT * FROM tenants';
    const params: unknown[] = [];

    if (filters?.is_active !== undefined) {
      sql += ' WHERE is_active = $1';
      params.push(filters.is_active);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query<Tenant>(sql, params);
    return result.rows;
  }

  async findByDocument(document: string): Promise<Tenant | null> {
    const result = await query<Tenant>('SELECT * FROM tenants WHERE document = $1', [document]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<Tenant | null> {
    const result = await query<Tenant>('SELECT * FROM tenants WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async create(data: CreateTenantDTO): Promise<Tenant> {
    const id = uuidv4();
    const result = await query<Tenant>(
      `INSERT INTO tenants (id, name, document, email, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      [id, data.name, data.document, data.email]
    );
    return result.rows[0];
  }

  async update(id: string, data: UpdateTenantDTO): Promise<Tenant> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.document !== undefined) {
      fields.push(`document = $${paramIndex++}`);
      values.push(data.document);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<Tenant>(
      `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    await query('UPDATE tenants SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
  }
}
