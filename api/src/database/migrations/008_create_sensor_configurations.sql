-- =============================================
-- Migration: 008_create_sensor_configurations
-- Description: Tabela para configurações operacionais de sensores
--              (local de instalação, limites de temperatura/umidade)
-- =============================================

CREATE TABLE IF NOT EXISTS sensor_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID NOT NULL UNIQUE REFERENCES sensors(id) ON DELETE CASCADE,
  installation_location VARCHAR(255),
  temperature_min DECIMAL(5,2),
  temperature_max DECIMAL(5,2),
  humidity_min DECIMAL(5,2),
  humidity_max DECIMAL(5,2),
  alerts_enabled BOOLEAN DEFAULT true,
  configured_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validações de integridade
  CONSTRAINT check_temp_range CHECK (
    temperature_min IS NULL OR temperature_max IS NULL OR temperature_min < temperature_max
  ),
  CONSTRAINT check_humidity_range CHECK (
    humidity_min IS NULL OR humidity_max IS NULL OR humidity_min < humidity_max
  ),
  CONSTRAINT check_humidity_values CHECK (
    (humidity_min IS NULL OR (humidity_min >= 0 AND humidity_min <= 100)) AND
    (humidity_max IS NULL OR (humidity_max >= 0 AND humidity_max <= 100))
  )
);

-- Índice para busca rápida por sensor
CREATE INDEX IF NOT EXISTS idx_sensor_config_sensor ON sensor_configurations(sensor_id);

-- Índice parcial para queries do worker de alertas (apenas sensores com alertas ativos)
CREATE INDEX IF NOT EXISTS idx_sensor_config_alerts ON sensor_configurations(alerts_enabled) WHERE alerts_enabled = true;
