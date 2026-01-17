-- =====================
-- GRUPOS DE SENSORES (Áreas, Equipamentos, etc)
-- =====================
CREATE TABLE IF NOT EXISTS sensor_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES sensor_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),  -- 'area', 'equipment', 'location', etc
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_groups_company ON sensor_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_sensor_groups_parent ON sensor_groups(parent_id);

-- =====================
-- SENSORES
-- =====================
CREATE TABLE IF NOT EXISTS sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number VARCHAR(50) UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  group_id UUID REFERENCES sensor_groups(id) ON DELETE SET NULL,
  name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensors_serial ON sensors(serial_number);
CREATE INDEX IF NOT EXISTS idx_sensors_company ON sensors(company_id);
CREATE INDEX IF NOT EXISTS idx_sensors_group ON sensors(group_id);
CREATE INDEX IF NOT EXISTS idx_sensors_active ON sensors(is_active) WHERE is_active = true;
