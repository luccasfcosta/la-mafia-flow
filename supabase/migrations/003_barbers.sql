-- Migration: 003_barbers
-- Description: Tabela de barbeiros
-- Created: LA MAFIA 13

CREATE TABLE IF NOT EXISTS barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    specialties TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_barbers_active ON barbers(active);
CREATE INDEX IF NOT EXISTS idx_barbers_user_id ON barbers(user_id);
CREATE INDEX IF NOT EXISTS idx_barbers_name ON barbers(name);

-- Trigger para updated_at
CREATE TRIGGER update_barbers_updated_at
    BEFORE UPDATE ON barbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE barbers IS 'Cadastro de barbeiros da barbearia';
COMMENT ON COLUMN barbers.commission_percentage IS 'Percentual de comissão do barbeiro (0-100)';
COMMENT ON COLUMN barbers.user_id IS 'Referência ao perfil de usuário, se o barbeiro tiver acesso ao sistema';

