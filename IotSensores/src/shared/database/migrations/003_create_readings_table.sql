-- Create readings table
CREATE TABLE IF NOT EXISTS readings (
    id UUID PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensors(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    serial_number VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2) NOT NULL,
    battery_level VARCHAR(20) NOT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for common queries
CREATE INDEX idx_readings_sensor_id ON readings(sensor_id);
CREATE INDEX idx_readings_tenant_id ON readings(tenant_id);
CREATE INDEX idx_readings_serial_number ON readings(serial_number);
CREATE INDEX idx_readings_received_at ON readings(received_at DESC);

-- Composite indexes for filtered queries
CREATE INDEX idx_readings_tenant_received ON readings(tenant_id, received_at DESC);
CREATE INDEX idx_readings_sensor_received ON readings(sensor_id, received_at DESC);

-- Partial index for battery level alerts
CREATE INDEX idx_readings_battery_critical ON readings(sensor_id, received_at DESC)
    WHERE battery_level IN ('LOW', 'CRITICAL');
