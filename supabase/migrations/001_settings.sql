-- Migration: 001_settings
-- Description: Configurações da barbearia
-- Created: LA MAFIA 13

-- Tabela de configurações da barbearia (singleton)
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_name TEXT NOT NULL DEFAULT 'LA MAFIA 13',
    logo_url TEXT,
    primary_color TEXT DEFAULT '#B8860B',
    secondary_color TEXT DEFAULT '#0D0D0D',
    whatsapp TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    opening_time TIME DEFAULT '09:00:00',
    closing_time TIME DEFAULT '20:00:00',
    working_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6], -- 0=domingo, 6=sábado
    slot_duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão
INSERT INTO settings (barbershop_name) 
VALUES ('LA MAFIA 13')
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE settings IS 'Configurações globais da barbearia';
COMMENT ON COLUMN settings.working_days IS 'Dias de funcionamento: 0=domingo, 1=segunda... 6=sábado';

