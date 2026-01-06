-- Migration: 005_clients
-- Description: Tabela de clientes
-- Created: LA MAFIA 13

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    cpf TEXT,
    birth_date DATE,
    notes TEXT,
    preferred_barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
    total_visits INTEGER DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_preferred_barber ON clients(preferred_barber_id);

-- Trigger para updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE clients IS 'Cadastro de clientes da barbearia';
COMMENT ON COLUMN clients.user_id IS 'Referência ao perfil se o cliente tiver conta no sistema';
COMMENT ON COLUMN clients.total_visits IS 'Contador de visitas para fidelização';

