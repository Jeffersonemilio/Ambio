-- Migration: Create temp_hum_readings table
-- Created: 2026-01-16

CREATE TABLE IF NOT EXISTS temp_hum_readings (
  id SERIAL PRIMARY KEY,
  serial_number VARCHAR(50) NOT NULL,
  temperature DECIMAL(5,2) NOT NULL,
  humidity DECIMAL(5,2) NOT NULL,
  battery_level VARCHAR(10) NOT NULL CHECK (battery_level IN ('LOW', 'MEDIUM', 'HIGH')),
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for queries by serial_number (device identification)
CREATE INDEX IF NOT EXISTS idx_readings_serial_number ON temp_hum_readings(serial_number);

-- Index for queries by time range
CREATE INDEX IF NOT EXISTS idx_readings_received_at ON temp_hum_readings(received_at);

-- Composite index for common queries filtering by device and time
CREATE INDEX IF NOT EXISTS idx_readings_serial_received ON temp_hum_readings(serial_number, received_at DESC);

COMMENT ON TABLE temp_hum_readings IS 'Leituras de temperatura e umidade dos sensores';
COMMENT ON COLUMN temp_hum_readings.serial_number IS 'Número de série único do equipamento';
COMMENT ON COLUMN temp_hum_readings.temperature IS 'Temperatura em Celsius';
COMMENT ON COLUMN temp_hum_readings.humidity IS 'Umidade relativa em percentual';
COMMENT ON COLUMN temp_hum_readings.battery_level IS 'Nível da bateria: LOW, MEDIUM, HIGH';
COMMENT ON COLUMN temp_hum_readings.received_at IS 'Timestamp quando o servidor recebeu a leitura';
