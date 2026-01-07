export interface Sensor {
  id: string;
  serial_number: string;
  tenant_id: string;
  name: string;
  location: string;
  is_active: boolean;
  last_reading_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSensorDTO {
  serial_number: string;
  tenant_id: string;
  name: string;
  location: string;
}

export interface UpdateSensorDTO {
  name?: string;
  location?: string;
  is_active?: boolean;
}
