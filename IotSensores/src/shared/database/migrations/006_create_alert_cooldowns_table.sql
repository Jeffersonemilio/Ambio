-- Create alert_cooldowns table to track cooldown periods
CREATE TABLE IF NOT EXISTS alert_cooldowns (
    id UUID PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensors(id),
    rule_id UUID NOT NULL REFERENCES rules(id),
    last_triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cooldown_sensor_rule UNIQUE (sensor_id, rule_id)
);

-- Create indexes
CREATE INDEX idx_cooldowns_sensor_id ON alert_cooldowns(sensor_id);
CREATE INDEX idx_cooldowns_rule_id ON alert_cooldowns(rule_id);
CREATE INDEX idx_cooldowns_last_triggered ON alert_cooldowns(last_triggered_at);
