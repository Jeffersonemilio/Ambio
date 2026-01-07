-- Create sensors table
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_reading_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE UNIQUE INDEX idx_sensors_serial_number ON sensors(serial_number);
CREATE INDEX idx_sensors_tenant_id ON sensors(tenant_id);
CREATE INDEX idx_sensors_is_active ON sensors(is_active);
CREATE INDEX idx_sensors_tenant_active ON sensors(tenant_id, is_active);
