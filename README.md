# LA MAFIA 13 - Sistema de Gestao para Barbearias

Sistema profissional de gerenciamento para barbearias com foco em estabilidade, escalabilidade e experiencia premium.

## Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Pagamentos**: AbacatePay (Pix, Cartao, Assinaturas)
- **Validacao**: Zod
- **Data Fetching**: Server Components + Server Actions

## Funcionalidades

### Dashboard Administrativo
- Painel com metricas do dia
- Agenda de agendamentos
- Gestao de clientes
- Gestao de barbeiros
- Catalogo de servicos
- Financeiro com ledger
- Assinaturas recorrentes
- Configuracoes da barbearia

### Portal Publico
- Agendamento online
- Area do cliente
- Historico de visitas

### Pagamentos
- Integracao com AbacatePay
- Pix com QR Code
- Webhooks idemmpotentes
- Ledger financeiro
- Calculo automatico de comissoes

## Instalacao

### Pre-requisitos
- Node.js 18+
- Conta no Supabase
- Conta no AbacatePay (para pagamentos)

### Setup

1. Clone o repositorio:
```bash
git clone <repo-url>
cd la-mafia-flow
```

2. Instale as dependencias:
```bash
npm install
```

3. Configure as variaveis de ambiente:
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ABACATEPAY_API_KEY=your_abacatepay_api_key
ABACATEPAY_WEBHOOK_SECRET=your_abacatepay_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Execute as migrations no Supabase:

Execute os arquivos SQL em `db/migrations/` na ordem numerica no SQL Editor do Supabase.

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/          # Paginas de autenticacao
│   ├── (public)/        # Portal publico
│   ├── dashboard/       # Dashboard administrativo
│   └── api/             # API routes (webhooks)
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── layout/          # Componentes de layout
│   └── forms/           # Componentes de formulario
├── lib/
│   ├── supabase/        # Clientes Supabase
│   ├── abacatepay/      # Cliente AbacatePay
│   └── utils.ts         # Utilitarios
├── services/            # Logica de negocio
└── schemas/             # Validacao Zod

db/
└── migrations/          # Migrations SQL
```

## Modelo de Dados

- `settings` - Configuracoes da barbearia
- `profiles` - Perfis de usuarios
- `barbers` - Barbeiros
- `services` - Servicos
- `clients` - Clientes
- `appointments` - Agendamentos
- `payment_intents` - Intencoes de pagamento
- `subscriptions` - Assinaturas
- `ledger_entries` - Ledger financeiro
- `commissions` - Comissoes
- `webhook_events` - Log de webhooks
- `audit_logs` - Logs de auditoria

## Seguranca

- Row Level Security (RLS) em todas as tabelas
- Autenticacao via Supabase Auth
- Validacao de webhooks com HMAC
- Idempotencia em operacoes de pagamento
- Auditoria de acoes

## Deploy

### Vercel

1. Conecte o repositorio ao Vercel
2. Configure as variaveis de ambiente
3. Deploy

### Supabase

1. Crie um novo projeto
2. Execute as migrations
3. Configure os webhooks no AbacatePay apontando para `/api/webhooks/abacatepay`

## Licenca

Proprietario - LA MAFIA 13
