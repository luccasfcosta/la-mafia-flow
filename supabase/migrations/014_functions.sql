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

