-- Migration: 006_appointments
-- Description: Tabela de agendamentos
-- Created: LA MAFIA 13

-- Enum para status de agendamento
CREATE TYPE appointment_status AS ENUM (
    'scheduled',    -- Agendado
    'confirmed',    -- Confirmado
    'in_progress',  -- Em atendimento
    'completed',    -- Concluído
    'cancelled',    -- Cancelado
    'no_show'       -- Não compareceu
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
-- Índice por data removido (start_time já cobre essa necessidade)

-- Índice composto para busca de disponibilidade
CREATE INDEX IF NOT EXISTS idx_appointments_barber_time 
    ON appointments(barber_id, start_time, end_time) 
    WHERE status NOT IN ('cancelled', 'no_show');

-- Trigger para updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function para atualizar contador de visitas do cliente
CREATE OR REPLACE FUNCTION update_client_visits()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE clients 
        SET 
            total_visits = total_visits + 1,
            last_visit_at = NEW.completed_at
        WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_appointment_completed
    AFTER UPDATE ON appointments
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_client_visits();

-- Comentários
COMMENT ON TABLE appointments IS 'Agendamentos de serviços';
COMMENT ON COLUMN appointments.price IS 'Preço cobrado (pode diferir do preço do serviço)';

