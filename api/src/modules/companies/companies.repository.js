const { query } = require('../../database');

class CompaniesRepository {
  async findAll(filters = {}, pagination = { limit: 50, offset: 0 }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.isActive !== undefined) {
      conditions.push(`c.is_active = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    if (filters.search) {
      conditions.push(`(c.name ILIKE $${paramIndex} OR c.cnpj ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM companies c ${whereClause}`,
      params
    );

    params.push(pagination.limit);
    params.push(pagination.offset);

    const result = await query(
      `SELECT
         c.*,
         (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as user_count,
         (SELECT COUNT(*) FROM sensors s WHERE s.company_id = c.id) as sensor_count
       FROM companies c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async findById(id) {
    const result = await query(
      `SELECT
         c.*,
         (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as user_count,
         (SELECT COUNT(*) FROM sensors s WHERE s.company_id = c.id) as sensor_count
       FROM companies c
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByCnpj(cnpj) {
    const result = await query(
      'SELECT id, cnpj FROM companies WHERE cnpj = $1',
      [cnpj]
    );
    return result.rows[0] || null;
  }

  async create(company) {
    const result = await query(
      `INSERT INTO companies (name, cnpj, email, phone, settings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        company.name,
        company.cnpj,
        company.email,
        company.phone || null,
        JSON.stringify(company.settings || {}),
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      params.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      params.push(data.phone);
    }

    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }

    if (data.settings !== undefined) {
      fields.push(`settings = $${paramIndex++}`);
      params.push(JSON.stringify(data.settings));
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE companies SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await query(
      'DELETE FROM companies WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }

  // Usuários da empresa
  async getCompanyUsers(companyId, pagination = { limit: 50, offset: 0 }) {
    const countResult = await query(
      'SELECT COUNT(*) FROM users WHERE company_id = $1',
      [companyId]
    );

    const result = await query(
      `SELECT id, email, name, company_role, is_active, last_login_at, created_at
       FROM users
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, pagination.limit, pagination.offset]
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  // Sensores da empresa
  async getCompanySensors(companyId, pagination = { limit: 50, offset: 0 }) {
    const countResult = await query(
      'SELECT COUNT(*) FROM sensors WHERE company_id = $1',
      [companyId]
    );

    const result = await query(
      `SELECT s.*, sg.name as group_name
       FROM sensors s
       LEFT JOIN sensor_groups sg ON s.group_id = sg.id
       WHERE s.company_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, pagination.limit, pagination.offset]
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }
}

module.exports = new CompaniesRepository();
