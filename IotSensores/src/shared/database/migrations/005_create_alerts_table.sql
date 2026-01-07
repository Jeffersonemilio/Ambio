-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sensor_id UUID NOT NULL REFERENCES sensors(id),
    reading_id UUID REFERENCES readings(id),
    rule_id UUID REFERENCES rules(id),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    value DECIMAL(10,2),
    threshold DECIMAL(10,2),
    triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID,
    resolved_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alert_type CHECK (type IN ('TEMPERATURE_HIGH', 'TEMPERATURE_LOW', 'HUMIDITY_HIGH', 'HUMIDITY_LOW', 'BATTERY_LOW', 'BATTERY_CRITICAL', 'SENSOR_OFFLINE')),
    CONSTRAINT chk_alert_severity CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    CONSTRAINT chk_alert_status CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED'))
);

-- Create indexes
CREATE INDEX idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX idx_alerts_sensor_id ON alerts(sensor_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_tenant_status ON alerts(tenant_id, status);
CREATE INDEX idx_alerts_sensor_triggered ON alerts(sensor_id, triggered_at DESC);
CREATE INDEX idx_alerts_triggered_at ON alerts(triggered_at DESC);
