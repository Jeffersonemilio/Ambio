-- =============================================
-- Migration: 010_create_system_settings
-- Description: Tabela para configuracoes globais do sistema
--              (limites padrao de alertas, politicas de notificacao)
-- =============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busca rapida por chave
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Inserir configuracoes padrao de alertas
INSERT INTO system_settings (key, value, description) VALUES
  ('alert_defaults', '{
    "temperature_min": -10.00,
    "temperature_max": 40.00,
    "humidity_min": 20.00,
    "humidity_max": 80.00
  }', 'Limites padrao de temperatura e umidade quando a empresa nao configura limites especificos'),
  ('alert_notification_policy', '{
    "max_attempts": 3,
    "retry_interval_minutes": 15,
    "enabled_channels": ["email"]
  }', 'Politica de retry de notificacoes e canais habilitados')
ON CONFLICT (key) DO NOTHING;
