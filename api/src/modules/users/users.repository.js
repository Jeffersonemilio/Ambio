const { query } = require('../../database');

class UsersRepository {
  async findAll(filters = {}, pagination = { limit: 50, offset: 0 }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.userType) {
      conditions.push(`u.user_type = $${paramIndex++}`);
      params.push(filters.userType);
    }

    if (filters.companyId) {
      conditions.push(`u.company_id = $${paramIndex++}`);
      params.push(filters.companyId);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`u.is_active = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    if (filters.search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.role) {
      conditions.push(`(u.ambio_role = $${paramIndex} OR u.company_role = $${paramIndex})`);
      params.push(filters.role);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );

    params.push(pagination.limit);
    params.push(pagination.offset);

    const result = await query(
      `SELECT
         u.id, u.email, u.name, u.user_type, u.ambio_role, u.company_role,
         u.company_id, u.is_active, u.email_verified, u.last_login_at,
         u.created_at, u.updated_at,
         c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       ${whereClause}
       ORDER BY u.created_at DESC
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
         u.id, u.email, u.name, u.user_type, u.ambio_role, u.company_role,
         u.company_id, u.is_active, u.email_verified, u.last_login_at,
         u.created_at, u.updated_at,
         c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(user) {
    const result = await query(
      `INSERT INTO users (email, password_hash, name, user_type, ambio_role, company_id, company_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, user_type, ambio_role, company_role, company_id, is_active, created_at`,
      [
        user.email,
        user.passwordHash,
        user.name,
        user.userType,
        user.ambioRole || null,
        user.companyId || null,
        user.companyRole || null,
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

    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }

    if (data.ambioRole !== undefined) {
      fields.push(`ambio_role = $${paramIndex++}`);
      params.push(data.ambioRole);
    }

    if (data.companyRole !== undefined) {
      fields.push(`company_role = $${paramIndex++}`);
      params.push(data.companyRole);
    }

    if (data.companyId !== undefined) {
      fields.push(`company_id = $${paramIndex++}`);
      params.push(data.companyId);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, email, name, user_type, ambio_role, company_role, company_id, is_active, updated_at`,
      params
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }

  async updatePassword(id, passwordHash) {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, id]
    );
  }

  // Permissões customizadas
  async getUserPermissions(userId) {
    const result = await query(
      'SELECT id, resource, actions, granted_by, created_at FROM user_permissions WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  async setUserPermission(userId, resource, actions, grantedBy) {
    const result = await query(
      `INSERT INTO user_permissions (user_id, resource, actions, granted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, resource) DO UPDATE SET actions = $3, granted_by = $4
       RETURNING id, resource, actions`,
      [userId, resource, actions, grantedBy]
    );
    return result.rows[0];
  }

  async removeUserPermission(userId, resource) {
    const result = await query(
      'DELETE FROM user_permissions WHERE user_id = $1 AND resource = $2 RETURNING id',
      [userId, resource]
    );
    return result.rowCount > 0;
  }

  // Módulos para admin Ambio
  async getAdminModules(userId) {
    const result = await query(
      'SELECT id, module, assigned_by, created_at FROM ambio_admin_modules WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  async assignAdminModule(userId, module, assignedBy) {
    const result = await query(
      `INSERT INTO ambio_admin_modules (user_id, module, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, module) DO NOTHING
       RETURNING id, module`,
      [userId, module, assignedBy]
    );
    return result.rows[0];
  }

  async removeAdminModule(userId, module) {
    const result = await query(
      'DELETE FROM ambio_admin_modules WHERE user_id = $1 AND module = $2 RETURNING id',
      [userId, module]
    );
    return result.rowCount > 0;
  }
}

module.exports = new UsersRepository();
