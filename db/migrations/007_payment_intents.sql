-- Migration: 007_payment_intents
-- Description: Intenções de pagamento (CRÍTICO para pagamentos)
-- Created: LA MAFIA 13

-- Enum para tipo de pagamento
CREATE TYPE payment_type AS ENUM ('one_time', 'subscription');

-- Enum para status de pagamento
CREATE TYPE payment_status AS ENUM (
    'pending',      -- Aguardando pagamento
    'processing',   -- Processando
    'paid',         -- Pago
    'failed',       -- Falhou
    'refunded',     -- Reembolsado
    'cancelled',    -- Cancelado
    'expired'       -- Expirado
);

-- Enum para provedor de pagamento
CREATE TYPE payment_provider AS ENUM ('abacatepay');

CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    subscription_id UUID, -- Referência será adicionada depois
    amount DECIMAL(10, 2) NOT NULL,
    type payment_type NOT NULL DEFAULT 'one_time',
    status payment_status NOT NULL DEFAULT 'pending',
    provider payment_provider NOT NULL DEFAULT 'abacatepay',
    provider_ref TEXT, -- ID da transação no provedor
    provider_checkout_url TEXT, -- URL de checkout (Pix, etc)
    provider_qr_code TEXT, -- QR Code base64 para Pix
    provider_pix_code TEXT, -- Código Pix copia e cola
    idempotency_key TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_intents_client ON payment_intents(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_appointment ON payment_intents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_ref ON payment_intents(provider_ref);
CREATE INDEX IF NOT EXISTS idx_payment_intents_idempotency ON payment_intents(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created ON payment_intents(created_at);

-- Trigger para updated_at
CREATE TRIGGER update_payment_intents_updated_at
    BEFORE UPDATE ON payment_intents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE payment_intents IS 'Intenções de pagamento - criadas antes da cobrança';
COMMENT ON COLUMN payment_intents.idempotency_key IS 'Chave única para garantir idempotência';
COMMENT ON COLUMN payment_intents.provider_ref IS 'ID da transação no provedor de pagamento';

