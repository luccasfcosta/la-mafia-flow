-- Migration: 010_commissions
-- Description: Comissões de barbeiros
-- Created: LA MAFIA 13

-- Enum para status de comissão
CREATE TYPE commission_status AS ENUM (
    'pending',    -- Pendente (aguardando pagamento do serviço)
    'approved',   -- Aprovada (serviço pago)
    'paid',       -- Paga ao barbeiro
    'cancelled'   -- Cancelada
);

CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
    base_amount DECIMAL(10, 2) NOT NULL, -- Valor base do serviço
    percentage DECIMAL(5, 2) NOT NULL, -- Percentual de comissão
    commission_amount DECIMAL(10, 2) NOT NULL, -- Valor calculado da comissão
    status commission_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    period_start DATE, -- Início do período de pagamento
    period_end DATE, -- Fim do período de pagamento
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_commissions_barber ON commissions(barber_id);
CREATE INDEX IF NOT EXISTS idx_commissions_appointment ON commissions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_commissions_created ON commissions(created_at);

-- Trigger para updated_at
CREATE TRIGGER update_commissions_updated_at
    BEFORE UPDATE ON commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View para resumo de comissões por barbeiro
CREATE OR REPLACE VIEW commissions_summary_by_barber AS
SELECT 
    b.id as barber_id,
    b.name as barber_name,
    c.status,
    COUNT(*) as commission_count,
    SUM(c.base_amount) as total_base,
    SUM(c.commission_amount) as total_commission,
    AVG(c.percentage) as avg_percentage
FROM commissions c
JOIN barbers b ON c.barber_id = b.id
GROUP BY b.id, b.name, c.status
ORDER BY b.name, c.status;

-- Comentários
COMMENT ON TABLE commissions IS 'Comissões de barbeiros por serviço realizado';
COMMENT ON COLUMN commissions.base_amount IS 'Valor base do serviço para cálculo';
COMMENT ON COLUMN commissions.percentage IS 'Percentual aplicado na comissão';

