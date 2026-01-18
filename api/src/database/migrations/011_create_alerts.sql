-- =============================================
-- Migration: 011_create_alerts
-- Description: Tabela de alertas para violacoes de limites de sensores
-- =============================================

-- Tipo enum para status do alerta
DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'exhausted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo enum para tipo de violacao
DO $$ BEGIN
  CREATE TYPE alert_violation_type AS ENUM ('temperature_min', 'temperature_max', 'humidity_min', 'humidity_max');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contexto
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  reading_id INTEGER REFERENCES temp_hum_readings(id) ON DELETE SET NULL,

  -- Detalhes da violacao
  violation_type alert_violation_type NOT NULL,
  actual_value DECIMAL(5,2) NOT NULL,
  threshold_value DECIMAL(5,2) NOT NULL,
  threshold_source VARCHAR(20) NOT NULL CHECK (threshold_source IN ('sensor_config', 'system_default')),

  -- Gerenciamento de estado
  status alert_status NOT NULL DEFAULT 'active',

  -- Rastreamento de notificacoes
  notification_count INTEGER NOT NULL DEFAULT 0,
  last_notification_at TIMESTAMPTZ,
  next_notification_at TIMESTAMPTZ,

  -- Resolucao
  resolved_at TIMESTAMPTZ,
  resolved_by_reading_id INTEGER REFERENCES temp_hum_readings(id) ON DELETE SET NULL,

  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices de performance
CREATE INDEX IF NOT EXISTS idx_alerts_company ON alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sensor ON alerts(sensor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON alerts(triggered_at DESC);

-- Indice para worker: encontrar alertas que precisam de notificacao
CREATE INDEX IF NOT EXISTS idx_alerts_pending_notification
  ON alerts(next_notification_at)
  WHERE status = 'active' AND next_notification_at IS NOT NULL;

-- Indice para encontrar alertas ativos por sensor (para verificar resolucao)
CREATE INDEX IF NOT EXISTS idx_alerts_active_sensor
  ON alerts(sensor_id, violation_type)
  WHERE status = 'active';

-- Indice composto para queries de dashboard
CREATE INDEX IF NOT EXISTS idx_alerts_company_status_time
  ON alerts(company_id, status, triggered_at DESC);

-- Indice unico para evitar alertas duplicados ativos
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_unique_active
  ON alerts(sensor_id, violation_type)
  WHERE status = 'active';

COMMENT ON TABLE alerts IS 'Alertas de violacao de limites para sensores';
COMMENT ON COLUMN alerts.threshold_source IS 'Origem do limite: sensor_configurations ou system_settings';
COMMENT ON COLUMN alerts.notification_count IS 'Numero de tentativas de notificacao realizadas';
COMMENT ON COLUMN alerts.next_notification_at IS 'Quando a proxima notificacao deve ser enviada (NULL se esgotado ou resolvido)';
