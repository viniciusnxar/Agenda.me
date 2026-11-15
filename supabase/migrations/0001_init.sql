-- agenda.me — schema inicial
-- Tabelas, anti-conflito de horários, RLS, RPC get_busy_ranges, trigger de booking_settings
-- e bucket de avatares. Ver docs/ARCHITECTURE.md, seções 4, 5 e 6.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: 1 por usuário
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text not null,
  profession text,
  registration text,
  bio text,
  avatar_url text,
  whatsapp text,
  timezone text not null default 'America/Sao_Paulo',
  theme text not null default 'default',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  -- nomes que colidem com rotas do app
  constraint profiles_username_reserved check (
    username not in (
      'admin', 'api', 'app', 'auth', 'c', 'cadastro', 'dashboard', 'login', 'logout',
      'onboarding', 'privacidade', 'robots', 'sitemap', 'static', 'www'
    )
  ),
  constraint profiles_full_name_length check (char_length(full_name) between 2 and 100),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  constraint profiles_whatsapp_format check (whatsapp is null or whatsapp ~ '^[0-9]{10,13}$')
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- social_links: cards da página pública
-- ---------------------------------------------------------------------------

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  label text,
  url text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint social_links_platform check (
    platform in ('instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'site', 'email', 'outro')
  ),
  constraint social_links_url_length check (char_length(url) between 1 and 500)
);

create index social_links_profile_position_idx on public.social_links (profile_id, position);

-- ---------------------------------------------------------------------------
-- booking_settings: regras de agenda (seção 5)
-- ---------------------------------------------------------------------------

create table public.booking_settings (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  is_enabled boolean not null default false,
  slot_duration_min integer not null default 50,
  buffer_min integer not null default 10,
  window_mode text not null default 'flexible',
  min_advance_days integer not null default 0,
  max_advance_days integer not null default 30,
  min_notice_minutes integer not null default 120,
  max_per_day integer,
  auto_confirm boolean not null default false,
  require_cpf boolean not null default false,
  plans_enabled boolean not null default false,
  require_plan boolean not null default false,
  allow_private boolean not null default true,
  whatsapp_enabled boolean not null default false,
  whatsapp_hold_slot boolean not null default false,
  whatsapp_message_template text not null
    default 'Olá! Gostaria de agendar para {data} às {hora}. Nome: {nome}. Plano: {plano}.',
  updated_at timestamptz not null default now(),

  constraint booking_settings_window_mode check (
    window_mode in ('flexible', 'same_day_only', 'next_day_only')
  ),
  constraint booking_settings_slot_duration check (slot_duration_min between 5 and 480),
  constraint booking_settings_buffer check (buffer_min between 0 and 240),
  constraint booking_settings_advance_days check (
    min_advance_days >= 0 and max_advance_days between min_advance_days and 365
  ),
  constraint booking_settings_min_notice check (min_notice_minutes between 0 and 10080),
  constraint booking_settings_max_per_day check (max_per_day is null or max_per_day > 0),
  constraint booking_settings_template_length check (char_length(whatsapp_message_template) <= 500)
);

create trigger booking_settings_set_updated_at
  before update on public.booking_settings
  for each row execute function public.set_updated_at();

-- cria as regras padrão quando o perfil nasce (onboarding)
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.booking_settings (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

create trigger profiles_create_booking_settings
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- ---------------------------------------------------------------------------
-- availability_rules: horários semanais (vários intervalos por dia)
-- ---------------------------------------------------------------------------

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null, -- 0 = domingo ... 6 = sábado
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),

  constraint availability_rules_weekday check (weekday between 0 and 6),
  constraint availability_rules_interval check (end_time > start_time)
);

create index availability_rules_profile_weekday_idx
  on public.availability_rules (profile_id, weekday, start_time);

-- ---------------------------------------------------------------------------
-- availability_exceptions: dia bloqueado ou horário especial
-- ---------------------------------------------------------------------------

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  is_blocked boolean not null default true,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now(),

  -- bloqueado = dia todo, sem horário; especial = precisa de um intervalo válido
  constraint availability_exceptions_interval check (
    (is_blocked and start_time is null and end_time is null)
    or (not is_blocked and start_time is not null and end_time is not null and end_time > start_time)
  ),
  constraint availability_exceptions_reason_length check (reason is null or char_length(reason) <= 200)
);

create index availability_exceptions_profile_date_idx
  on public.availability_exceptions (profile_id, date);

-- ---------------------------------------------------------------------------
-- plans: planos/convênios aceitos
-- ---------------------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint plans_name_length check (char_length(name) between 1 and 80),
  constraint plans_name_unique unique (profile_id, name)
);

create index plans_profile_position_idx on public.plans (profile_id, position);

-- ---------------------------------------------------------------------------
-- appointments: agendamentos com os dados do cliente
-- ---------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  blocked_until timestamptz not null, -- ends_at + buffer
  status text not null default 'pending',
  source text not null default 'booking',
  client_name text not null,
  client_phone text not null,
  client_cpf text,
  plan_id uuid references public.plans (id) on delete set null,
  plan_name text, -- cópia do nome (ou "Particular") no momento do agendamento
  notes text,
  consent_at timestamptz,
  cancel_token text not null unique
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_status check (
    status in ('pending', 'confirmed', 'completed', 'no_show', 'cancelled')
  ),
  constraint appointments_source check (source in ('booking', 'whatsapp', 'manual')),
  constraint appointments_interval check (ends_at > starts_at and blocked_until >= ends_at),
  constraint appointments_client_name_length check (char_length(client_name) between 2 and 100),
  constraint appointments_client_phone_format check (client_phone ~ '^[0-9]{10,13}$'),
  constraint appointments_client_cpf_format check (client_cpf is null or client_cpf ~ '^[0-9]{11}$'),
  constraint appointments_notes_length check (notes is null or char_length(notes) <= 500),

  -- anti-conflito: dois agendamentos ativos do mesmo perfil não podem se sobrepor (erro 23P01)
  constraint appointments_no_overlap exclude using gist (
    profile_id with =,
    tstzrange(starts_at, blocked_until, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create index appointments_profile_starts_idx on public.appointments (profile_id, starts_at);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS (seção 6)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.social_links enable row level security;
alter table public.booking_settings enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.plans enable row level security;
alter table public.appointments enable row level security;

-- profiles
create policy "profiles: público lê perfis publicados"
  on public.profiles for select
  to anon, authenticated
  using (is_published);

create policy "profiles: dono gerencia o próprio perfil"
  on public.profiles for all
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- tabelas filhas: leitura pública se o perfil está publicado; dono gerencia tudo
create policy "social_links: público lê de perfis publicados"
  on public.social_links for select
  to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.is_published));

create policy "social_links: dono gerencia"
  on public.social_links for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "booking_settings: público lê de perfis publicados"
  on public.booking_settings for select
  to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.is_published));

create policy "booking_settings: dono gerencia"
  on public.booking_settings for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "availability_rules: público lê de perfis publicados"
  on public.availability_rules for select
  to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.is_published));

create policy "availability_rules: dono gerencia"
  on public.availability_rules for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "availability_exceptions: público lê de perfis publicados"
  on public.availability_exceptions for select
  to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.is_published));

create policy "availability_exceptions: dono gerencia"
  on public.availability_exceptions for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "plans: público lê de perfis publicados"
  on public.plans for select
  to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.is_published));

create policy "plans: dono gerencia"
  on public.plans for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- appointments: público não acessa nada; dono só lê e atualiza.
-- Criação pelo cliente passa pela Server Action com o client admin.
create policy "appointments: dono lê"
  on public.appointments for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "appointments: dono atualiza"
  on public.appointments for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RPC get_busy_ranges: só intervalos ocupados, sem dados do cliente
-- ---------------------------------------------------------------------------

create or replace function public.get_busy_ranges(p_profile_id uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, blocked_until timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.starts_at, a.blocked_until
  from public.appointments a
  join public.profiles p on p.id = a.profile_id
  where a.profile_id = p_profile_id
    and p.is_published
    and a.status in ('pending', 'confirmed')
    and a.starts_at < p_to
    and a.blocked_until > p_from
  order by a.starts_at;
$$;

revoke all on function public.get_busy_ranges(uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_busy_ranges(uuid, timestamptz, timestamptz) to anon, authenticated;

-- funções de trigger não devem ser chamadas pela API
revoke all on function public.handle_new_profile() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket público de avatares, cada usuário escreve na própria pasta (<uid>/...)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- leitura pública vem da URL pública do bucket; o SELECT abaixo é para o upsert do dono
create policy "avatars: dono lê a própria pasta"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: dono envia na própria pasta"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: dono atualiza na própria pasta"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: dono remove da própria pasta"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
