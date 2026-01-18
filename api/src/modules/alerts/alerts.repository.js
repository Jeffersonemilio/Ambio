const { query } = require('../../database');

class AlertsRepository {
  async findAll(filters = {}, pagination = { limit: 50, offset: 0 }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.companyId) {
      conditions.push(`a.company_id = $${paramIndex++}`);
      params.push(filters.companyId);
    }

    if (filters.sensorId) {
      conditions.push(`a.sensor_id = $${paramIndex++}`);
      params.push(filters.sensorId);
    }

    if (filters.status) {
      conditions.push(`a.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.violationType) {
      conditions.push(`a.violation_type = $${paramIndex++}`);
      params.push(filters.violationType);
    }

    if (filters.startDate) {
      conditions.push(`a.triggered_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`a.triggered_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM alerts a ${whereClause}`,
      params
    );

    params.push(pagination.limit);
    params.push(pagination.offset);

    const result = await query(
      `SELECT
         a.*,
         c.name as company_name,
         s.serial_number as sensor_serial,
         s.name as sensor_name,
         sc.installation_location as sensor_location
       FROM alerts a
       LEFT JOIN companies c ON a.company_id = c.id
       LEFT JOIN sensors s ON a.sensor_id = s.id
       LEFT JOIN sensor_configurations sc ON s.id = sc.sensor_id
       ${whereClause}
       ORDER BY a.triggered_at DESC
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
         a.*,
         c.name as company_name,
         s.serial_number as sensor_serial,
         s.name as sensor_name,
         sc.installation_location as sensor_location,
         r.temperature as reading_temperature,
         r.humidity as reading_humidity,
         r.received_at as reading_received_at
       FROM alerts a
       LEFT JOIN companies c ON a.company_id = c.id
       LEFT JOIN sensors s ON a.sensor_id = s.id
       LEFT JOIN sensor_configurations sc ON s.id = sc.sensor_id
       LEFT JOIN temp_hum_readings r ON a.reading_id = r.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findActiveByCompany(companyId) {
    const result = await query(
      `SELECT
         a.*,
         s.serial_number as sensor_serial,
         s.name as sensor_name,
         sc.installation_location as sensor_location
       FROM alerts a
       LEFT JOIN sensors s ON a.sensor_id = s.id
       LEFT JOIN sensor_configurations sc ON s.id = sc.sensor_id
       WHERE a.company_id = $1 AND a.status = 'active'
       ORDER BY a.triggered_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findActiveBySensor(sensorId) {
    const result = await query(
      `SELECT * FROM alerts
       WHERE sensor_id = $1 AND status = 'active'
       ORDER BY triggered_at DESC`,
      [sensorId]
    );
    return result.rows;
  }

  async findActiveByTypeAndSensor(sensorId, violationType) {
    const result = await query(
      `SELECT * FROM alerts
       WHERE sensor_id = $1
         AND violation_type = $2
         AND status = 'active'`,
      [sensorId, violationType]
    );
    return result.rows[0] || null;
  }

  async findPendingNotification(limit = 100) {
    const result = await query(
      `SELECT
         a.*,
         c.name as company_name,
         s.serial_number as sensor_serial,
         s.name as sensor_name,
         sc.installation_location as sensor_location
       FROM alerts a
       LEFT JOIN companies c ON a.company_id = c.id
       LEFT JOIN sensors s ON a.sensor_id = s.id
       LEFT JOIN sensor_configurations sc ON s.id = sc.sensor_id
       WHERE a.status = 'active'
         AND a.next_notification_at <= NOW()
         AND a.notification_count < 3
       ORDER BY a.next_notification_at
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async findUnresolvedBySensor(sensorId) {
    const result = await query(
      `SELECT * FROM alerts
       WHERE sensor_id = $1
         AND status IN ('active', 'exhausted')
       ORDER BY triggered_at DESC`,
      [sensorId]
    );
    return result.rows;
  }

  async create(alert) {
    const result = await query(
      `INSERT INTO alerts (
         company_id, sensor_id, reading_id, violation_type,
         actual_value, threshold_value, threshold_source,
         next_notification_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (sensor_id, violation_type) WHERE status = 'active'
       DO NOTHING
       RETURNING *`,
      [
        alert.companyId,
        alert.sensorId,
        alert.readingId,
        alert.violationType,
        alert.actualValue,
        alert.thresholdValue,
        alert.thresholdSource,
      ]
    );
    return result.rows[0] || null;
  }

  async updateNotificationTracking(id, data) {
    const result = await query(
      `UPDATE alerts SET
         notification_count = $1,
         last_notification_at = $2,
         next_notification_at = $3,
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        data.notificationCount,
        data.lastNotificationAt,
        data.nextNotificationAt,
        id,
      ]
    );
    return result.rows[0];
  }

  async markResolved(id, resolvedByReadingId) {
    const result = await query(
      `UPDATE alerts SET
         status = 'resolved',
         resolved_at = NOW(),
         resolved_by_reading_id = $1,
         next_notification_at = NULL,
         updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [resolvedByReadingId, id]
    );
    return result.rows[0];
  }

  async markExhausted(id) {
    const result = await query(
      `UPDATE alerts SET
         status = 'exhausted',
         next_notification_at = NULL,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async getStatsByCompany(companyId, dateRange = {}) {
    const conditions = ['company_id = $1'];
    const params = [companyId];
    let paramIndex = 2;

    if (dateRange.startDate) {
      conditions.push(`triggered_at >= $${paramIndex++}`);
      params.push(dateRange.startDate);
    }

    if (dateRange.endDate) {
      conditions.push(`triggered_at <= $${paramIndex++}`);
      params.push(dateRange.endDate);
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT
         status,
         violation_type,
         COUNT(*) as count
       FROM alerts
       WHERE ${whereClause}
       GROUP BY status, violation_type
       ORDER BY status, violation_type`,
      params
    );
    return result.rows;
  }

  async getStatsBySensor(sensorId, dateRange = {}) {
    const conditions = ['sensor_id = $1'];
    const params = [sensorId];
    let paramIndex = 2;

    if (dateRange.startDate) {
      conditions.push(`triggered_at >= $${paramIndex++}`);
      params.push(dateRange.startDate);
    }

    if (dateRange.endDate) {
      conditions.push(`triggered_at <= $${paramIndex++}`);
      params.push(dateRange.endDate);
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT
         status,
         violation_type,
         COUNT(*) as count,
         AVG(EXTRACT(EPOCH FROM (resolved_at - triggered_at))) as avg_resolution_time_seconds
       FROM alerts
       WHERE ${whereClause}
       GROUP BY status, violation_type
       ORDER BY status, violation_type`,
      params
    );
    return result.rows;
  }

  // Log de processamento
  async startProcessingRun() {
    const result = await query(
      `INSERT INTO alert_processing_runs (status)
       VALUES ('running')
       RETURNING id`
    );
    return result.rows[0].id;
  }

  async completeProcessingRun(runId, metrics) {
    const result = await query(
      `UPDATE alert_processing_runs SET
         completed_at = NOW(),
         status = 'completed',
         sensors_checked = $1,
         readings_evaluated = $2,
         alerts_created = $3,
         alerts_resolved = $4,
         notifications_sent = $5,
         notifications_failed = $6
       WHERE id = $7
       RETURNING *`,
      [
        metrics.sensorsChecked || 0,
        metrics.readingsEvaluated || 0,
        metrics.alertsCreated || 0,
        metrics.alertsResolved || 0,
        metrics.notificationsSent || 0,
        metrics.notificationsFailed || 0,
        runId,
      ]
    );
    return result.rows[0];
  }

  async failProcessingRun(runId, errors) {
    const result = await query(
      `UPDATE alert_processing_runs SET
         completed_at = NOW(),
         status = 'failed',
         errors = $1
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(errors), runId]
    );
    return result.rows[0];
  }
}

module.exports = new AlertsRepository();
