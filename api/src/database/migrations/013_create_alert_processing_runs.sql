-- =============================================
-- Migration: 013_create_alert_processing_runs
-- Description: Log de execucoes do worker de alertas (monitoramento/debug)
-- =============================================

CREATE TABLE IF NOT EXISTS alert_processing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Estatisticas de execucao
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Metricas
  sensors_checked INTEGER NOT NULL DEFAULT 0,
  readings_evaluated INTEGER NOT NULL DEFAULT 0,
  alerts_created INTEGER NOT NULL DEFAULT 0,
  alerts_resolved INTEGER NOT NULL DEFAULT 0,
  notifications_sent INTEGER NOT NULL DEFAULT 0,
  notifications_failed INTEGER NOT NULL DEFAULT 0,

  -- Rastreamento de erros
  errors JSONB DEFAULT '[]',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_alert_processing_runs_started ON alert_processing_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_processing_runs_status ON alert_processing_runs(status);

COMMENT ON TABLE alert_processing_runs IS 'Log de auditoria das execucoes do worker de alertas';
