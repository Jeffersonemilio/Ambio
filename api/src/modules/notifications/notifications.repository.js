const { query } = require('../../database');

class NotificationsRepository {
  async findByAlert(alertId) {
    const result = await query(
      `SELECT
         na.*,
         u.name as recipient_name,
         u.email as recipient_email
       FROM notification_attempts na
       LEFT JOIN users u ON na.recipient_id = u.id
       WHERE na.alert_id = $1
       ORDER BY na.created_at DESC`,
      [alertId]
    );
    return result.rows;
  }

  async findByRecipient(userId, pagination = { limit: 50, offset: 0 }) {
    const countResult = await query(
      'SELECT COUNT(*) FROM notification_attempts WHERE recipient_id = $1',
      [userId]
    );

    const result = await query(
      `SELECT
         na.*,
         a.violation_type,
         a.actual_value,
         a.threshold_value,
         a.status as alert_status,
         s.serial_number as sensor_serial,
         s.name as sensor_name
       FROM notification_attempts na
       LEFT JOIN alerts a ON na.alert_id = a.id
       LEFT JOIN sensors s ON a.sensor_id = s.id
       WHERE na.recipient_id = $1
       ORDER BY na.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pagination.limit, pagination.offset]
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async findPending() {
    const result = await query(
      `SELECT * FROM notification_attempts
       WHERE status = 'pending'
       ORDER BY created_at`
    );
    return result.rows;
  }

  async create(attempt) {
    const result = await query(
      `INSERT INTO notification_attempts (
         alert_id, recipient_id, channel, recipient_address, attempt_number, status
       )
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        attempt.alertId,
        attempt.recipientId,
        attempt.channel,
        attempt.recipientAddress,
        attempt.attemptNumber,
      ]
    );
    return result.rows[0];
  }

  async markSent(id, providerResponse = null) {
    const result = await query(
      `UPDATE notification_attempts SET
         status = 'sent',
         sent_at = NOW(),
         provider_response = $1
       WHERE id = $2
       RETURNING *`,
      [providerResponse ? JSON.stringify(providerResponse) : null, id]
    );
    return result.rows[0];
  }

  async markFailed(id, errorMessage) {
    const result = await query(
      `UPDATE notification_attempts SET
         status = 'failed',
         error_message = $1
       WHERE id = $2
       RETURNING *`,
      [errorMessage, id]
    );
    return result.rows[0];
  }

  async markSkipped(id, reason) {
    const result = await query(
      `UPDATE notification_attempts SET
         status = 'skipped',
         error_message = $1
       WHERE id = $2
       RETURNING *`,
      [reason, id]
    );
    return result.rows[0];
  }

  async getDeliveryStats(dateRange = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (dateRange.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(dateRange.startDate);
    }

    if (dateRange.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(dateRange.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         channel,
         status,
         COUNT(*) as count
       FROM notification_attempts
       ${whereClause}
       GROUP BY channel, status
       ORDER BY channel, status`,
      params
    );
    return result.rows;
  }

  async countByAlertAndChannel(alertId, channel) {
    const result = await query(
      `SELECT COUNT(*) FROM notification_attempts
       WHERE alert_id = $1 AND channel = $2`,
      [alertId, channel]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = new NotificationsRepository();
