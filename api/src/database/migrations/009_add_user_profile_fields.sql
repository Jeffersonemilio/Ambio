-- =====================
-- CAMPOS DE PERFIL DO USUÁRIO
-- =====================

-- Adicionar campo avatar_url na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- Adicionar campo preferences (JSONB) para configurações do usuário
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN users.avatar_url IS 'URL do avatar do usuário (caminho relativo para o arquivo)';
COMMENT ON COLUMN users.preferences IS 'Preferências do usuário em formato JSON (notificações, etc)';
