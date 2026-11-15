# agenda.me

Link da bio que também agenda consultas. Cada profissional (psicólogo, médico, nutricionista...)
ganha uma **página pública estilo Linktree** em `/<username>`, com foto, bio, registro e cards
das redes sociais, e uma **agenda online** que o paciente usa sozinho, sem criar conta.

A arquitetura completa está em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Funcionalidades

**Para o paciente**

- Página pública rápida e mobile-first, com imagem de compartilhamento (Open Graph) por perfil
- Calendário que mostra os dias **disponíveis**, **lotados** e **fechados**
- Escolha de horário e formulário com nome, telefone, CPF (se exigido), plano e observações
- Consentimento LGPD obrigatório e página de [privacidade](src/app/(marketing)/privacidade/page.tsx)
- **Confirmar agendamento** direto ou **Solicitar via WhatsApp** com a mensagem pronta
- Link `/c/<token>` para ver ou cancelar o próprio agendamento

**Para o profissional**

- Cadastro com senha ou magic link e escolha do endereço (`/<username>`) no onboarding
- Editor da página com preview ao vivo: foto, bio, tema, redes sociais em ordem
- Horários semanais com vários intervalos por dia, dias bloqueados e horários especiais
- Regras: duração, intervalo entre consultas, janela de dias (`flexible`, `same_day_only`,
  `next_day_only`), antecedência mínima, limite por dia, confirmação automática, CPF e plano obrigatórios
- Planos e convênios aceitos, com a opção "Particular"
- Agenda em semana e mês, com drawer de detalhes (CPF mascarado) e ações: confirmar, cancelar,
  concluir e faltou
- Agendamento manual (inclusive fora da grade) e histórico com busca e filtro

**Segurança**

- Isolamento por profissional com Row Level Security no Postgres
- O público só enxerga os **intervalos ocupados** (RPC `get_busy_ranges`), nunca quem agendou
- Dois agendamentos não se sobrepõem nem com cliques simultâneos (`EXCLUDE USING gist`, erro `23P01`)
- O servidor recalcula os horários antes de gravar; honeypot e limite de agendamentos abertos por telefone/CPF
- CPF não aparece em logs; na agenda ele chega ao navegador já mascarado

## Stack

| Camada | Tecnologia |
|---|---|
| Front e back | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, lucide-react, sonner |
| Banco, auth e arquivos | Supabase (Postgres + RLS, Auth, Storage) |
| Validação | Zod 4 |
| Datas | date-fns, date-fns-tz e `Intl` (pt-BR, fuso do profissional) |
| Testes | Vitest |
| Deploy | Vercel |

## Como rodar

Requisitos: Node.js 20 ou mais novo e uma conta no [Supabase](https://supabase.com) (o plano grátis basta).

### 1. Instale as dependências

```bash
npm install
```

### 2. Crie o banco no Supabase

1. Crie um projeto no painel do Supabase.
2. Aplique as migrations, de um destes jeitos:
   - pela CLI: `npx supabase link --project-ref <ref>` e depois `npx supabase db push`
   - pelo painel: cole `supabase/migrations/0001_init.sql` e depois `0002_avatar_limits.sql` no **SQL Editor**
3. Em **Authentication → URL Configuration**:
   - **Site URL**: a URL do app (`http://localhost:3000` em desenvolvimento)
   - **Redirect URLs**: adicione `http://localhost:3000/**` e, em produção, `https://<seu-app>.vercel.app/**`

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz (ele é ignorado pelo git):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # só no servidor, nunca exponha
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

As chaves ficam em **Project Settings → API**.

### 4. Rode

```bash
npm run dev
```

Abra <http://localhost:3000>, crie uma conta, escolha o endereço da página e, no painel:
defina os horários em **Disponibilidade**, ative o agendamento em **Regras** e publique a página no **Resumo**.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm start` | serve o build |
| `npm run lint` | ESLint |
| `npm run typecheck` | checagem de tipos (`tsc --noEmit`) |
| `npm test` | testes com Vitest |
| `npm run test:watch` | testes em modo watch |
| `npm run db:types` | regenera `src/types/database.ts` a partir do projeto ligado (`npx supabase link`) |

## Estrutura

```
src/
  app/
    (marketing)/          landing e privacidade
    (auth)/               login, cadastro e actions de autenticação
    auth/callback/        retorno dos links enviados por e-mail
    onboarding/           escolha do username e dados iniciais
    [username]/           página pública, OG image e fluxo de agendamento
      agendar/            calendário, horários, formulário e actions
      agendar/sucesso/    confirmação com o link do paciente
    c/[token]/            paciente vê ou cancela o agendamento
    dashboard/            painel: resumo, agenda, página, disponibilidade, regras, planos, histórico
  components/
    ui/                   componentes do shadcn
    public/               página pública e fluxo de agendamento
    dashboard/            componentes do painel
  lib/
    scheduling/           motor de horários (funções puras + testes)
    validation/           CPF, telefone e schemas zod
    supabase/             clients server, browser, admin e middleware
  middleware.ts           renova a sessão e protege /dashboard e /onboarding
  types/database.ts       tipos do banco
supabase/migrations/      schema, RLS, RPC e limites do Storage
docs/ARCHITECTURE.md      arquitetura, regras e fluxos
```

### Motor de horários

`src/lib/scheduling` não conhece banco nem React, então é todo testável:

- `window.ts`: quais dias podem ser agendados, conforme o `window_mode`
- `slots.ts`: horários livres de um dia, com buffer, antecedência mínima, limite por dia, exceções e conflitos
- `calendar.ts`: status de cada dia do mês (disponível, lotado ou fechado)
- `time.ts`: datas locais e conversão de fuso (21h em Fortaleza já é o dia seguinte em UTC)

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Cadastre as quatro variáveis de ambiente, com `NEXT_PUBLIC_APP_URL=https://<seu-app>.vercel.app`.
3. No Supabase, atualize a **Site URL** e as **Redirect URLs** com o domínio da Vercel.
4. Faça o deploy. Cada push na `main` gera um novo deploy.

## Licença

[GPL-3.0](LICENSE)
