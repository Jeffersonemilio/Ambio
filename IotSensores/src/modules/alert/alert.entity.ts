export type AlertType =
  | 'TEMPERATURE_HIGH'
  | 'TEMPERATURE_LOW'
  | 'HUMIDITY_HIGH'
  | 'HUMIDITY_LOW'
  | 'BATTERY_LOW'
  | 'BATTERY_CRITICAL'
  | 'SENSOR_OFFLINE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: string;
  tenant_id: string;
  sensor_id: string;
  reading_id: string | null;
  rule_id: string | null;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string | null;
  value: number | null;
  threshold: number | null;
  triggered_at: Date;
  acknowledged_at: Date | null;
  acknowledged_by: string | null;
  resolved_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAlertDTO {
  tenant_id: string;
  sensor_id: string;
  reading_id?: string | null;
  rule_id?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message?: string | null;
  value?: number | null;
  threshold?: number | null;
  metadata?: Record<string, unknown>;
}

export interface AlertFilters {
  tenant_id?: string;
  sensor_id?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}
