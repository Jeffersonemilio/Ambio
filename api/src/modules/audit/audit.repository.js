const { query } = require('../../database');

class AuditRepository {
  async create(log) {
    const result = await query(
      `INSERT INTO audit_logs (user_id, impersonated_by, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        log.userId,
        log.impersonatedBy || null,
        log.action,
        log.resourceType,
        log.resourceId || null,
        JSON.stringify(log.details || {}),
        log.ipAddress || null,
        log.userAgent || null,
      ]
    );
    return result.rows[0];
  }

  async findAll(filters = {}, pagination = { limit: 50, offset: 0 }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters.action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(filters.action);
    }

    if (filters.resourceType) {
      conditions.push(`al.resource_type = $${paramIndex++}`);
      params.push(filters.resourceType);
    }

    if (filters.resourceId) {
      conditions.push(`al.resource_id = $${paramIndex++}`);
      params.push(filters.resourceId);
    }

    if (filters.startDate) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    if (filters.impersonatedOnly) {
      conditions.push('al.impersonated_by IS NOT NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM audit_logs al ${whereClause}`,
      params
    );

    const limitParam = paramIndex++;
    const offsetParam = paramIndex++;
    const queryParams = [...params, pagination.limit, pagination.offset];

    const result = await query(
      `SELECT
         al.*,
         u.name as user_name,
         u.email as user_email,
         imp.name as impersonated_by_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN users imp ON al.impersonated_by = imp.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      queryParams
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
         al.*,
         u.name as user_name,
         u.email as user_email,
         imp.name as impersonated_by_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN users imp ON al.impersonated_by = imp.id
       WHERE al.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = new AuditRepository();
