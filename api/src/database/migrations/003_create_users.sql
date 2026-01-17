-- =====================
-- USUÁRIOS
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,

  -- Tipo: 'ambio' ou 'company'
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('ambio', 'company')),

  -- Para usuários Ambio
  ambio_role VARCHAR(20) CHECK (ambio_role IN ('super_admin', 'admin', 'analyst', 'support')),

  -- Para usuários de empresa
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_role VARCHAR(20) CHECK (company_role IN ('admin', 'analyst', 'user')),

  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_user_type CHECK (
    (user_type = 'ambio' AND ambio_role IS NOT NULL AND company_id IS NULL AND company_role IS NULL) OR
    (user_type = 'company' AND company_role IS NOT NULL AND company_id IS NOT NULL AND ambio_role IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
