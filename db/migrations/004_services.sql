-- Migration: 004_services
-- Description: Tabela de serviços
-- Created: LA MAFIA 13

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    category TEXT,
    allow_subscription BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_allow_subscription ON services(allow_subscription);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

-- Trigger para updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE services IS 'Catálogo de serviços oferecidos';
COMMENT ON COLUMN services.allow_subscription IS 'Se o serviço pode ser incluído em planos de assinatura';
COMMENT ON COLUMN services.duration_minutes IS 'Duração estimada do serviço em minutos';

