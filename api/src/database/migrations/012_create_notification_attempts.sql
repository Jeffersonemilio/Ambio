-- =============================================
-- Migration: 012_create_notification_attempts
-- Description: Historico completo de tentativas de envio de notificacoes
-- =============================================

-- Tipo enum para canal de notificacao
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'phone');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo enum para status da notificacao
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Informacoes de entrega
  channel notification_channel NOT NULL,
  recipient_address VARCHAR(255) NOT NULL,
  attempt_number INTEGER NOT NULL,

  -- Status
  status notification_status NOT NULL DEFAULT 'pending',

  -- Detalhes do resultado
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  provider_response JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices de performance
CREATE INDEX IF NOT EXISTS idx_notification_attempts_alert ON notification_attempts(alert_id);
CREATE INDEX IF NOT EXISTS idx_notification_attempts_recipient ON notification_attempts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_attempts_status ON notification_attempts(status);
CREATE INDEX IF NOT EXISTS idx_notification_attempts_created ON notification_attempts(created_at DESC);

-- Indice para encontrar notificacoes pendentes
CREATE INDEX IF NOT EXISTS idx_notification_attempts_pending
  ON notification_attempts(alert_id, attempt_number)
  WHERE status = 'pending';

-- Indice composto para queries de auditoria
CREATE INDEX IF NOT EXISTS idx_notification_attempts_audit
  ON notification_attempts(alert_id, channel, created_at DESC);

COMMENT ON TABLE notification_attempts IS 'Log de auditoria de todas as tentativas de envio de notificacao';
COMMENT ON COLUMN notification_attempts.recipient_address IS 'Email, telefone ou outro identificador especifico do canal';
COMMENT ON COLUMN notification_attempts.provider_response IS 'Resposta JSON do provedor de notificacao para debug';
