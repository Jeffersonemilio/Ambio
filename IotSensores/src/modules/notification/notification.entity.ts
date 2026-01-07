export type NotificationType = 'EMAIL' | 'SMS' | 'PUSH';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  type: NotificationType;
  recipient: string;
  subject: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationLog {
  id: string;
  tenant_id: string;
  alert_id: string | null;
  type: NotificationType;
  recipient: string;
  subject: string | null;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: Date | null;
  created_at: Date;
}

export interface CreateNotificationLogDTO {
  tenant_id: string;
  alert_id?: string | null;
  type: NotificationType;
  recipient: string;
  subject?: string | null;
  status?: NotificationStatus;
  error_message?: string | null;
}
