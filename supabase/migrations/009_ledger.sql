-- Migration: 009_ledger
-- Description: Ledger financeiro (registros contábeis)
-- Created: LA MAFIA 13

-- Enum para tipo de entrada no ledger
CREATE TYPE ledger_kind AS ENUM ('credit', 'debit');

-- Categorias de transação
CREATE TYPE ledger_category AS ENUM (
    'service_payment',      -- Pagamento de serviço
    'subscription_payment', -- Pagamento de assinatura
    'refund',              -- Reembolso
    'commission',          -- Comissão (saída)
    'expense',             -- Despesa operacional
    'adjustment',          -- Ajuste manual
    'withdrawal'           -- Saque
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind ledger_kind NOT NULL,
    category ledger_category NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_table TEXT, -- Nome da tabela referenciada
    reference_id UUID, -- ID do registro referenciado
    payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
    balance_after DECIMAL(10, 2), -- Saldo após esta entrada
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ledger_kind ON ledger_entries(kind);
CREATE INDEX IF NOT EXISTS idx_ledger_category ON ledger_entries(category);
CREATE INDEX IF NOT EXISTS idx_ledger_occurred_at ON ledger_entries(occurred_at);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON ledger_entries(reference_table, reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_payment_intent ON ledger_entries(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_ledger_barber ON ledger_entries(barber_id);

-- View para saldo atual
CREATE OR REPLACE VIEW current_balance AS
SELECT 
    COALESCE(SUM(CASE WHEN kind = 'credit' THEN amount ELSE -amount END), 0) as balance,
    COALESCE(SUM(CASE WHEN kind = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
    COALESCE(SUM(CASE WHEN kind = 'debit' THEN amount ELSE 0 END), 0) as total_debits
FROM ledger_entries;

-- View para resumo por período
CREATE OR REPLACE VIEW ledger_summary_by_month AS
SELECT 
    DATE_TRUNC('month', occurred_at) as month,
    category,
    kind,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM ledger_entries
GROUP BY DATE_TRUNC('month', occurred_at), category, kind
ORDER BY month DESC, category;

-- Comentários
COMMENT ON TABLE ledger_entries IS 'Ledger financeiro - registro imutável de transações';
COMMENT ON COLUMN ledger_entries.kind IS 'credit = entrada, debit = saída';
COMMENT ON COLUMN ledger_entries.balance_after IS 'Saldo calculado após esta transação';

