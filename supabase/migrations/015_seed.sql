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

