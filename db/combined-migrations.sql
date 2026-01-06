-- LA MAFIA 13 - Combined Migrations
-- Generated: 2026-01-06T00:05:29.746Z

-- ========================================
-- Migration: 001_settings.sql
-- ========================================

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



-- ========================================
-- Migration: 002_profiles.sql
-- ========================================

-- Migration: 002_profiles
-- Description: Perfis de usuários (extensão do auth.users)
-- Created: LA MAFIA 13

-- Enum para roles de usuário
CREATE TYPE user_role AS ENUM ('admin', 'barber', 'staff', 'client');

-- Tabela de perfis (extensão de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'client',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil ao registrar novo usuário
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Comentários
COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema';
COMMENT ON COLUMN profiles.role IS 'Papel do usuário: admin, barber, staff ou client';



-- ========================================
-- Migration: 003_barbers.sql
-- ========================================

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



-- ========================================
-- Migration: 004_services.sql
-- ========================================

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



-- ========================================
-- Migration: 005_clients.sql
-- ========================================

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



-- ========================================
-- Migration: 006_appointments.sql
-- ========================================

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
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(DATE(start_time));

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



-- ========================================
-- Migration: 007_payment_intents.sql
-- ========================================

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



-- ========================================
-- Migration: 008_subscriptions.sql
-- ========================================

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



-- ========================================
-- Migration: 009_ledger.sql
-- ========================================

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



-- ========================================
-- Migration: 010_commissions.sql
-- ========================================

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



-- ========================================
-- Migration: 011_webhooks.sql
-- ========================================

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



-- ========================================
-- Migration: 012_audit.sql
-- ========================================

-- Migration: 012_audit
-- Description: Logs de auditoria
-- Created: LA MAFIA 13

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc
    entity TEXT NOT NULL, -- Nome da tabela/entidade
    entity_id UUID,
    old_values JSONB, -- Valores anteriores (para update/delete)
    new_values JSONB, -- Novos valores (para create/update)
    metadata JSONB DEFAULT '{}', -- Informações adicionais
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Function genérica para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log(
    p_actor_id UUID,
    p_action TEXT,
    p_entity TEXT,
    p_entity_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_actor_email TEXT;
BEGIN
    -- Buscar email do ator
    SELECT email INTO v_actor_email FROM profiles WHERE id = p_actor_id;
    
    INSERT INTO audit_logs (
        actor_user_id, actor_email, action, entity, 
        entity_id, old_values, new_values, metadata
    )
    VALUES (
        p_actor_id, v_actor_email, p_action, p_entity,
        p_entity_id, p_old_values, p_new_values, p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE audit_logs IS 'Registro de auditoria de todas as ações do sistema';
COMMENT ON FUNCTION create_audit_log IS 'Função auxiliar para criar logs de auditoria';



-- ========================================
-- Migration: 013_rls_policies.sql
-- ========================================

-- Migration: 013_rls_policies
-- Description: Políticas de Row Level Security
-- Created: LA MAFIA 13

-- Habilitar RLS em todas as tabelas
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Função para verificar se usuário é staff (admin, barber, staff)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'barber', 'staff')
        AND active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter role do usuário atual
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SETTINGS - Apenas staff pode ver/editar
-- ============================================
CREATE POLICY "Staff can view settings" ON settings
    FOR SELECT USING (is_staff());

CREATE POLICY "Admin can update settings" ON settings
    FOR UPDATE USING (is_admin());

-- ============================================
-- PROFILES - Próprio perfil ou staff
-- ============================================
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON profiles
    FOR SELECT USING (is_staff());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can manage profiles" ON profiles
    FOR ALL USING (is_admin());

-- ============================================
-- BARBERS - Público para leitura, staff para escrita
-- ============================================
CREATE POLICY "Anyone can view active barbers" ON barbers
    FOR SELECT USING (active = true);

CREATE POLICY "Staff can view all barbers" ON barbers
    FOR SELECT USING (is_staff());

CREATE POLICY "Admin can manage barbers" ON barbers
    FOR ALL USING (is_admin());

-- ============================================
-- SERVICES - Público para leitura, staff para escrita
-- ============================================
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT USING (active = true);

CREATE POLICY "Staff can view all services" ON services
    FOR SELECT USING (is_staff());

CREATE POLICY "Admin can manage services" ON services
    FOR ALL USING (is_admin());

-- ============================================
-- CLIENTS - Staff pode ver todos, cliente vê próprio
-- ============================================
CREATE POLICY "Staff can manage clients" ON clients
    FOR ALL USING (is_staff());

CREATE POLICY "Client can view own record" ON clients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Client can update own record" ON clients
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- APPOINTMENTS - Staff vê todos, cliente vê próprios
-- ============================================
CREATE POLICY "Staff can manage appointments" ON appointments
    FOR ALL USING (is_staff());

CREATE POLICY "Client can view own appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = appointments.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Client can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = appointments.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- ============================================
-- PAYMENT_INTENTS - Staff vê todos, cliente vê próprios
-- ============================================
CREATE POLICY "Staff can manage payment_intents" ON payment_intents
    FOR ALL USING (is_staff());

CREATE POLICY "Client can view own payment_intents" ON payment_intents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = payment_intents.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- ============================================
-- SUBSCRIPTIONS - Staff vê todos, cliente vê próprios
-- ============================================
CREATE POLICY "Staff can manage subscriptions" ON subscriptions
    FOR ALL USING (is_staff());

CREATE POLICY "Client can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = subscriptions.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- ============================================
-- LEDGER_ENTRIES - Apenas admin
-- ============================================
CREATE POLICY "Admin can view ledger" ON ledger_entries
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can manage ledger" ON ledger_entries
    FOR ALL USING (is_admin());

-- ============================================
-- COMMISSIONS - Admin e barbeiros próprios
-- ============================================
CREATE POLICY "Admin can manage commissions" ON commissions
    FOR ALL USING (is_admin());

CREATE POLICY "Barber can view own commissions" ON commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM barbers 
            WHERE barbers.id = commissions.barber_id 
            AND barbers.user_id = auth.uid()
        )
    );

-- ============================================
-- WEBHOOK_EVENTS - Apenas admin
-- ============================================
CREATE POLICY "Admin can view webhooks" ON webhook_events
    FOR SELECT USING (is_admin());

-- ============================================
-- AUDIT_LOGS - Apenas admin
-- ============================================
CREATE POLICY "Admin can view audit_logs" ON audit_logs
    FOR SELECT USING (is_admin());

-- Comentários
COMMENT ON FUNCTION is_staff IS 'Verifica se usuário atual é funcionário';
COMMENT ON FUNCTION is_admin IS 'Verifica se usuário atual é admin';



-- ========================================
-- Migration: 014_functions.sql
-- ========================================

-- Migration: 014_functions
-- Description: Functions e procedures úteis
-- Created: LA MAFIA 13

-- ============================================
-- FUNÇÃO: Verificar disponibilidade de horário
-- ============================================
CREATE OR REPLACE FUNCTION check_availability(
    p_barber_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM appointments
        WHERE barber_id = p_barber_id
        AND status NOT IN ('cancelled', 'no_show')
        AND id != COALESCE(p_exclude_appointment_id, '00000000-0000-0000-0000-000000000000')
        AND (
            (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Obter próximos horários disponíveis
-- ============================================
CREATE OR REPLACE FUNCTION get_available_slots(
    p_barber_id UUID,
    p_date DATE,
    p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ
) AS $$
DECLARE
    v_opening TIME;
    v_closing TIME;
    v_slot_duration INTEGER;
    v_current_slot TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
BEGIN
    -- Buscar configurações
    SELECT opening_time, closing_time, slot_duration_minutes
    INTO v_opening, v_closing, v_slot_duration
    FROM settings LIMIT 1;
    
    v_slot_duration := COALESCE(v_slot_duration, 30);
    v_opening := COALESCE(v_opening, '09:00:00');
    v_closing := COALESCE(v_closing, '20:00:00');
    
    -- Gerar slots
    v_current_slot := p_date + v_opening;
    
    WHILE v_current_slot + (p_duration_minutes || ' minutes')::INTERVAL <= p_date + v_closing LOOP
        v_slot_end := v_current_slot + (p_duration_minutes || ' minutes')::INTERVAL;
        
        -- Verificar disponibilidade
        IF check_availability(p_barber_id, v_current_slot, v_slot_end) THEN
            slot_start := v_current_slot;
            slot_end := v_slot_end;
            RETURN NEXT;
        END IF;
        
        v_current_slot := v_current_slot + (v_slot_duration || ' minutes')::INTERVAL;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Processar pagamento confirmado
-- ============================================
CREATE OR REPLACE FUNCTION process_payment_confirmed(
    p_payment_intent_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_payment payment_intents%ROWTYPE;
    v_appointment appointments%ROWTYPE;
    v_barber barbers%ROWTYPE;
    v_commission_amount DECIMAL(10, 2);
BEGIN
    -- Buscar payment intent
    SELECT * INTO v_payment FROM payment_intents WHERE id = p_payment_intent_id;
    
    IF v_payment.id IS NULL THEN
        RAISE EXCEPTION 'Payment intent não encontrado';
    END IF;
    
    IF v_payment.status = 'paid' THEN
        -- Já processado
        RETURN TRUE;
    END IF;
    
    -- Atualizar status do payment
    UPDATE payment_intents 
    SET status = 'paid', paid_at = NOW(), updated_at = NOW()
    WHERE id = p_payment_intent_id;
    
    -- Criar entrada no ledger
    INSERT INTO ledger_entries (kind, category, amount, reference_table, reference_id, payment_intent_id, description)
    VALUES ('credit', 'service_payment', v_payment.amount, 'payment_intents', p_payment_intent_id, p_payment_intent_id, 'Pagamento de serviço');
    
    -- Se tem agendamento vinculado
    IF v_payment.appointment_id IS NOT NULL THEN
        -- Buscar agendamento e barbeiro
        SELECT * INTO v_appointment FROM appointments WHERE id = v_payment.appointment_id;
        SELECT * INTO v_barber FROM barbers WHERE id = v_appointment.barber_id;
        
        -- Calcular e criar comissão
        v_commission_amount := v_payment.amount * (v_barber.commission_percentage / 100);
        
        INSERT INTO commissions (barber_id, appointment_id, payment_intent_id, base_amount, percentage, commission_amount, status)
        VALUES (v_barber.id, v_appointment.id, p_payment_intent_id, v_payment.amount, v_barber.commission_percentage, v_commission_amount, 'approved');
        
        -- Criar entrada de débito no ledger para comissão
        INSERT INTO ledger_entries (kind, category, amount, reference_table, reference_id, barber_id, description)
        VALUES ('debit', 'commission', v_commission_amount, 'commissions', 
                (SELECT id FROM commissions WHERE payment_intent_id = p_payment_intent_id LIMIT 1),
                v_barber.id, 'Comissão de ' || v_barber.name);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Estatísticas do dashboard
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT,
    total_revenue DECIMAL(10, 2),
    total_commissions DECIMAL(10, 2),
    new_clients BIGINT,
    active_subscriptions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM appointments WHERE DATE(start_time) BETWEEN p_start_date AND p_end_date)::BIGINT,
        (SELECT COUNT(*) FROM appointments WHERE DATE(start_time) BETWEEN p_start_date AND p_end_date AND status = 'completed')::BIGINT,
        (SELECT COUNT(*) FROM appointments WHERE DATE(start_time) BETWEEN p_start_date AND p_end_date AND status = 'cancelled')::BIGINT,
        (SELECT COALESCE(SUM(amount), 0) FROM payment_intents WHERE DATE(paid_at) BETWEEN p_start_date AND p_end_date AND status = 'paid'),
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date AND status IN ('approved', 'paid')),
        (SELECT COUNT(*) FROM clients WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date)::BIGINT,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Gerar idempotency key
-- ============================================
CREATE OR REPLACE FUNCTION generate_idempotency_key(
    p_prefix TEXT DEFAULT 'pi'
)
RETURNS TEXT AS $$
BEGIN
    RETURN p_prefix || '_' || gen_random_uuid()::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON FUNCTION check_availability IS 'Verifica se horário está disponível para agendamento';
COMMENT ON FUNCTION get_available_slots IS 'Retorna slots disponíveis para um barbeiro em uma data';
COMMENT ON FUNCTION process_payment_confirmed IS 'Processa pagamento confirmado, cria ledger e comissões';
COMMENT ON FUNCTION get_dashboard_stats IS 'Retorna estatísticas para o dashboard';



-- ========================================
-- Migration: 015_seed.sql
-- ========================================

-- Migration: 015_seed
-- Description: Dados iniciais para desenvolvimento
-- Created: LA MAFIA 13

-- Inserir configurações padrão (se não existir)
INSERT INTO settings (barbershop_name, whatsapp, address, city, state)
VALUES ('LA MAFIA 13', '11999999999', 'Rua da Barbearia, 13', 'São Paulo', 'SP')
ON CONFLICT DO NOTHING;

-- Inserir serviços padrão
INSERT INTO services (name, description, price, duration_minutes, category, allow_subscription, display_order) VALUES
('Corte Clássico', 'Corte tradicional com máquina e tesoura', 45.00, 30, 'Corte', true, 1),
('Corte + Barba', 'Corte completo com barba feita na navalha', 70.00, 45, 'Combo', true, 2),
('Barba', 'Barba completa com toalha quente e navalha', 35.00, 30, 'Barba', true, 3),
('Pigmentação', 'Pigmentação para barba ou cabelo', 50.00, 45, 'Tratamento', false, 4),
('Corte Infantil', 'Corte para crianças até 12 anos', 35.00, 30, 'Corte', false, 5),
('Sobrancelha', 'Design de sobrancelha masculina', 15.00, 15, 'Acabamento', true, 6),
('Hidratação', 'Tratamento de hidratação capilar', 40.00, 30, 'Tratamento', false, 7),
('Platinado', 'Descoloração completa', 120.00, 90, 'Coloração', false, 8)
ON CONFLICT DO NOTHING;

-- Comentário
COMMENT ON TABLE services IS 'Serviços populados com dados iniciais para LA MAFIA 13';



