-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sensor_id UUID REFERENCES sensors(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    threshold_min DECIMAL(10,2),
    threshold_max DECIMAL(10,2),
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    is_active BOOLEAN NOT NULL DEFAULT true,
    cooldown_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rule_type CHECK (type IN ('TEMPERATURE', 'HUMIDITY', 'BATTERY')),
    CONSTRAINT chk_rule_condition CHECK (condition IN ('ABOVE', 'BELOW', 'BETWEEN', 'OUTSIDE')),
    CONSTRAINT chk_rule_severity CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL'))
);

-- Create indexes
CREATE INDEX idx_rules_tenant_id ON rules(tenant_id);
CREATE INDEX idx_rules_sensor_id ON rules(sensor_id);
CREATE INDEX idx_rules_tenant_active ON rules(tenant_id, is_active);
CREATE INDEX idx_rules_type ON rules(type);
