const { query } = require('../../database');

class SystemSettingsRepository {
  async findAll() {
    const result = await query(
      `SELECT ss.*, u.name as updated_by_name
       FROM system_settings ss
       LEFT JOIN users u ON ss.updated_by = u.id
       ORDER BY ss.key`
    );
    return result.rows;
  }

  async findByKey(key) {
    const result = await query(
      `SELECT ss.*, u.name as updated_by_name
       FROM system_settings ss
       LEFT JOIN users u ON ss.updated_by = u.id
       WHERE ss.key = $1`,
      [key]
    );
    return result.rows[0] || null;
  }

  async upsert(key, value, description, updatedBy) {
    const result = await query(
      `INSERT INTO system_settings (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key)
       DO UPDATE SET
         value = EXCLUDED.value,
         description = COALESCE(EXCLUDED.description, system_settings.description),
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value), description, updatedBy]
    );
    return result.rows[0];
  }

  async delete(key) {
    const result = await query(
      'DELETE FROM system_settings WHERE key = $1 RETURNING id',
      [key]
    );
    return result.rowCount > 0;
  }

  // Metodos especificos para alertas
  async getAlertDefaults() {
    const setting = await this.findByKey('alert_defaults');
    if (!setting) {
      return {
        temperature_min: -10,
        temperature_max: 40,
        humidity_min: 20,
        humidity_max: 80,
      };
    }
    return setting.value;
  }

  async getNotificationPolicy() {
    const setting = await this.findByKey('alert_notification_policy');
    if (!setting) {
      return {
        max_attempts: 3,
        retry_interval_minutes: 15,
        enabled_channels: ['email'],
      };
    }
    return setting.value;
  }
}

module.exports = new SystemSettingsRepository();
