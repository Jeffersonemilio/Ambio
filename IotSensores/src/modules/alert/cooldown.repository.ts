import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/database/index.js';

export interface AlertCooldown {
  id: string;
  sensor_id: string;
  rule_id: string;
  last_triggered_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class CooldownRepository {
  async findBySensorAndRule(sensor_id: string, rule_id: string): Promise<AlertCooldown | null> {
    const result = await query<AlertCooldown>(
      'SELECT * FROM alert_cooldowns WHERE sensor_id = $1 AND rule_id = $2',
      [sensor_id, rule_id]
    );
    return result.rows[0] || null;
  }

  async upsert(sensor_id: string, rule_id: string): Promise<AlertCooldown> {
    const id = uuidv4();
    const result = await query<AlertCooldown>(
      `INSERT INTO alert_cooldowns (id, sensor_id, rule_id, last_triggered_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW(), NOW())
       ON CONFLICT (sensor_id, rule_id)
       DO UPDATE SET last_triggered_at = NOW(), updated_at = NOW()
       RETURNING *`,
      [id, sensor_id, rule_id]
    );
    return result.rows[0];
  }

  async isInCooldown(sensor_id: string, rule_id: string, cooldown_minutes: number): Promise<boolean> {
    const result = await query<{ in_cooldown: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM alert_cooldowns
        WHERE sensor_id = $1
        AND rule_id = $2
        AND last_triggered_at > NOW() - INTERVAL '1 minute' * $3
      ) as in_cooldown`,
      [sensor_id, rule_id, cooldown_minutes]
    );
    return result.rows[0]?.in_cooldown ?? false;
  }

  async cleanup(days: number = 30): Promise<number> {
    const result = await query(
      `DELETE FROM alert_cooldowns
       WHERE last_triggered_at < NOW() - INTERVAL '1 day' * $1`,
      [days]
    );
    return result.rowCount ?? 0;
  }
}
