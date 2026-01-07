export type BatteryLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

export interface Reading {
  id: string;
  sensor_id: string;
  tenant_id: string;
  serial_number: string;
  temperature: number;
  humidity: number;
  battery_level: BatteryLevel;
  received_at: Date;
  metadata: Record<string, unknown>;
}

export interface CreateReadingDTO {
  sensor_id: string;
  tenant_id: string;
  serial_number: string;
  temperature: number;
  humidity: number;
  battery_level: BatteryLevel;
  metadata?: Record<string, unknown>;
}

export interface ReadingFilters {
  tenant_id?: string;
  sensor_id?: string;
  serial_number?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}
