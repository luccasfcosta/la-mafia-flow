-- Migration: 011_webhooks
-- Description: Registro de webhooks recebidos (auditoria)
-- Created: LA MAFIA 13

-- Enum para status de processamento
CREATE TYPE webhook_status AS ENUM (
    'received',   -- Recebido
    'processing', -- Processando
    'processed',  -- Processado com sucesso
    'failed',     -- Falhou
    'ignored'     -- Ignorado (duplicado, etc)
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'abacatepay', etc
    event_type TEXT NOT NULL, -- Tipo do evento
    provider_event_id TEXT NOT NULL, -- ID único do evento no provedor
    payload JSONB NOT NULL, -- Payload completo do webhook
    headers JSONB, -- Headers HTTP para debugging
    signature TEXT, -- Assinatura recebida
    signature_valid BOOLEAN,
    status webhook_status NOT NULL DEFAULT 'received',
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint de unicidade para garantir idempotência
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event 
    ON webhook_events(provider, provider_event_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON webhook_events(received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);

-- Comentários
COMMENT ON TABLE webhook_events IS 'Log de todos os webhooks recebidos para auditoria';
COMMENT ON COLUMN webhook_events.provider_event_id IS 'ID único do evento no provedor - usado para idempotência';
COMMENT ON COLUMN webhook_events.signature_valid IS 'Se a assinatura HMAC foi validada com sucesso';

