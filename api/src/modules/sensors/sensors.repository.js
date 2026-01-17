const { query } = require('../../database');

class SensorsRepository {
  async findAll(filters = {}, pagination = { limit: 50, offset: 0 }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.companyId) {
      conditions.push(`s.company_id = $${paramIndex++}`);
      params.push(filters.companyId);
    }

    if (filters.groupId) {
      conditions.push(`s.group_id = $${paramIndex++}`);
      params.push(filters.groupId);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`s.is_active = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    if (filters.unassigned) {
      conditions.push('s.company_id IS NULL');
    }

    if (filters.search) {
      conditions.push(`(s.serial_number ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM sensors s ${whereClause}`,
      params
    );

    params.push(pagination.limit);
    params.push(pagination.offset);

    const result = await query(
      `SELECT
         s.*,
         c.name as company_name,
         sg.name as group_name,
         (SELECT COUNT(*) FROM temp_hum_readings r WHERE r.serial_number = s.serial_number) as reading_count,
         (SELECT MAX(received_at) FROM temp_hum_readings r WHERE r.serial_number = s.serial_number) as last_reading_at
       FROM sensors s
       LEFT JOIN companies c ON s.company_id = c.id
       LEFT JOIN sensor_groups sg ON s.group_id = sg.id
       ${whereClause}
       ORDER BY s.created_at DESC
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
         s.*,
         c.name as company_name,
         sg.name as group_name,
         (SELECT COUNT(*) FROM temp_hum_readings r WHERE r.serial_number = s.serial_number) as reading_count,
         (SELECT MAX(received_at) FROM temp_hum_readings r WHERE r.serial_number = s.serial_number) as last_reading_at
       FROM sensors s
       LEFT JOIN companies c ON s.company_id = c.id
       LEFT JOIN sensor_groups sg ON s.group_id = sg.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findBySerialNumber(serialNumber) {
    const result = await query(
      `SELECT
         s.*,
         c.name as company_name
       FROM sensors s
       LEFT JOIN companies c ON s.company_id = c.id
       WHERE s.serial_number = $1`,
      [serialNumber]
    );
    return result.rows[0] || null;
  }

  async create(sensor) {
    const result = await query(
      `INSERT INTO sensors (serial_number, company_id, group_id, name, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        sensor.serialNumber,
        sensor.companyId || null,
        sensor.groupId || null,
        sensor.name || null,
        sensor.description || null,
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

    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }

    if (data.companyId !== undefined) {
      fields.push(`company_id = $${paramIndex++}`);
      params.push(data.companyId);
    }

    if (data.groupId !== undefined) {
      fields.push(`group_id = $${paramIndex++}`);
      params.push(data.groupId);
    }

    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE sensors SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await query(
      'DELETE FROM sensors WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }

  async assignToCompany(id, companyId) {
    const result = await query(
      `UPDATE sensors SET company_id = $1, group_id = NULL, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [companyId, id]
    );
    return result.rows[0];
  }

  async unassign(id) {
    const result = await query(
      `UPDATE sensors SET company_id = NULL, group_id = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  // Grupos de sensores
  async findAllGroups(companyId, pagination = { limit: 50, offset: 0 }) {
    const countResult = await query(
      'SELECT COUNT(*) FROM sensor_groups WHERE company_id = $1',
      [companyId]
    );

    const result = await query(
      `SELECT
         sg.*,
         (SELECT COUNT(*) FROM sensors s WHERE s.group_id = sg.id) as sensor_count,
         p.name as parent_name
       FROM sensor_groups sg
       LEFT JOIN sensor_groups p ON sg.parent_id = p.id
       WHERE sg.company_id = $1
       ORDER BY sg.name
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

  async findGroupById(id) {
    const result = await query(
      `SELECT
         sg.*,
         (SELECT COUNT(*) FROM sensors s WHERE s.group_id = sg.id) as sensor_count,
         p.name as parent_name
       FROM sensor_groups sg
       LEFT JOIN sensor_groups p ON sg.parent_id = p.id
       WHERE sg.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createGroup(group) {
    const result = await query(
      `INSERT INTO sensor_groups (company_id, parent_id, name, type, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        group.companyId,
        group.parentId || null,
        group.name,
        group.type || null,
        JSON.stringify(group.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async updateGroup(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }

    if (data.parentId !== undefined) {
      fields.push(`parent_id = $${paramIndex++}`);
      params.push(data.parentId);
    }

    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      params.push(data.type);
    }

    if (data.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      params.push(JSON.stringify(data.metadata));
    }

    if (fields.length === 0) {
      return this.findGroupById(id);
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    const result = await query(
      `UPDATE sensor_groups SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async deleteGroup(id) {
    const result = await query(
      'DELETE FROM sensor_groups WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }

  async moveSensorsToGroup(groupId, sensorIds) {
    const result = await query(
      `UPDATE sensors SET group_id = $1, updated_at = NOW()
       WHERE id = ANY($2)
       RETURNING id`,
      [groupId, sensorIds]
    );
    return result.rowCount;
  }
}

module.exports = new SensorsRepository();
