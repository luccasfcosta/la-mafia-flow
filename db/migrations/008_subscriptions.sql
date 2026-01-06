-- Migration: 008_subscriptions
-- Description: Assinaturas recorrentes
-- Created: LA MAFIA 13

-- Enum para status de assinatura
CREATE TYPE subscription_status AS ENUM (
    'active',       -- Ativa
    'paused',       -- Pausada
    'cancelled',    -- Cancelada
    'past_due',     -- Pagamento atrasado
    'expired'       -- Expirada
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    plan_description TEXT,
    monthly_price DECIMAL(10, 2) NOT NULL,
    services_included UUID[] DEFAULT '{}', -- IDs dos serviços incluídos
    max_uses_per_month INTEGER, -- Limite de usos por mês (NULL = ilimitado)
    uses_this_month INTEGER DEFAULT 0,
    status subscription_status NOT NULL DEFAULT 'active',
    abacatepay_subscription_id TEXT,
    billing_day INTEGER DEFAULT 1, -- Dia do mês para cobrança
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar referência na payment_intents
ALTER TABLE payment_intents 
    ADD CONSTRAINT fk_payment_intents_subscription 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_abacatepay ON subscriptions(abacatepay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Trigger para updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function para resetar contador de usos no início do mês
CREATE OR REPLACE FUNCTION reset_subscription_uses()
RETURNS TRIGGER AS $$
BEGIN
    IF DATE_TRUNC('month', NEW.current_period_start) != DATE_TRUNC('month', OLD.current_period_start) THEN
        NEW.uses_this_month = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_period_change
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION reset_subscription_uses();

-- Comentários
COMMENT ON TABLE subscriptions IS 'Assinaturas recorrentes de clientes';
COMMENT ON COLUMN subscriptions.services_included IS 'Array de UUIDs dos serviços incluídos no plano';
COMMENT ON COLUMN subscriptions.max_uses_per_month IS 'Limite de usos mensais (NULL = ilimitado)';

