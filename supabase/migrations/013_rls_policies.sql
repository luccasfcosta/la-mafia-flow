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

