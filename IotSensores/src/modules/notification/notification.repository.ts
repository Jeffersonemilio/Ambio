import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/database/index.js';
import { NotificationLog, CreateNotificationLogDTO, NotificationStatus } from './notification.entity.js';

export class NotificationLogRepository {
  async findById(id: string): Promise<NotificationLog | null> {
    const result = await query<NotificationLog>('SELECT * FROM notifications_log WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByAlertId(alert_id: string): Promise<NotificationLog[]> {
    const result = await query<NotificationLog>(
      'SELECT * FROM notifications_log WHERE alert_id = $1 ORDER BY created_at DESC',
      [alert_id]
    );
    return result.rows;
  }

  async findByTenantId(tenant_id: string, limit = 100): Promise<NotificationLog[]> {
    const result = await query<NotificationLog>(
      'SELECT * FROM notifications_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2',
      [tenant_id, limit]
    );
    return result.rows;
  }

  async create(data: CreateNotificationLogDTO): Promise<NotificationLog> {
    const id = uuidv4();
    const result = await query<NotificationLog>(
      `INSERT INTO notifications_log (id, tenant_id, alert_id, type, recipient, subject, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        id,
        data.tenant_id,
        data.alert_id || null,
        data.type,
        data.recipient,
        data.subject || null,
        data.status || 'PENDING',
      ]
    );
    return result.rows[0];
  }

  async updateStatus(id: string, status: NotificationStatus, error_message?: string): Promise<NotificationLog> {
    const result = await query<NotificationLog>(
      `UPDATE notifications_log
       SET status = $2::text, error_message = $3, sent_at = CASE WHEN $2::text = 'SENT' THEN NOW() ELSE sent_at END
       WHERE id = $1
       RETURNING *`,
      [id, status, error_message || null]
    );
    return result.rows[0];
  }

  async countByStatus(tenant_id: string): Promise<Record<NotificationStatus, number>> {
    const result = await query<{ status: NotificationStatus; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM notifications_log
       WHERE tenant_id = $1
       GROUP BY status`,
      [tenant_id]
    );

    const counts: Record<NotificationStatus, number> = {
      PENDING: 0,
      SENT: 0,
      FAILED: 0,
    };

    for (const row of result.rows) {
      counts[row.status] = parseInt(row.count, 10);
    }

    return counts;
  }
}
