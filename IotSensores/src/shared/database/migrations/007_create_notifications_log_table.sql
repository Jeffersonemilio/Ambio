-- Create notifications_log table to track sent notifications
CREATE TABLE IF NOT EXISTS notifications_log (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    alert_id UUID REFERENCES alerts(id),
    type VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notification_type CHECK (type IN ('EMAIL', 'SMS', 'PUSH')),
    CONSTRAINT chk_notification_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

-- Create indexes
CREATE INDEX idx_notifications_tenant_id ON notifications_log(tenant_id);
CREATE INDEX idx_notifications_alert_id ON notifications_log(alert_id);
CREATE INDEX idx_notifications_status ON notifications_log(status);
CREATE INDEX idx_notifications_created_at ON notifications_log(created_at DESC);
