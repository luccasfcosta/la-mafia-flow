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

