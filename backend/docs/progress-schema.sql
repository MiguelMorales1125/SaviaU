-- Extensión para UUID
create extension if not exists pgcrypto;

-- 1) Catálogo de insignias
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon_url text,
  criteria_type text not null, -- TRIVIA_COMPLETED_COUNT | DIAGNOSTIC_COMPLETED | NEWS_READ_COUNT | TOPIC_MASTERY
  criteria_value jsonb,        -- Ej: {"count":5} o {"topic":"Clima","threshold":80}
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Insignias obtenidas por usuario
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  source text
);
create unique index if not exists uq_user_badge on public.user_badges(user_id, badge_id);
create index if not exists idx_user_badges_user on public.user_badges(user_id);

-- 3) Registro genérico de actividades del usuario
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,           -- TRIVIA_COMPLETED | TRIVIA_ANSWER | DIAGNOSTIC_COMPLETED | NEWS_READ | ...
  metadata jsonb,               -- libre: {attemptId:"...", score: 87.5, setId:"...", articleId:"..."}
  created_at timestamptz not null default now()
);
create index if not exists idx_user_activities_user on public.user_activities(user_id);
create index if not exists idx_user_activities_type on public.user_activities(type);

-- 4) Insignias base (opcional)
insert into public.badges (code, name, description, icon_url, criteria_type, criteria_value)
values
  ('first_trivia', 'Primera Trivia', 'Completa tu primera trivia', null, 'TRIVIA_COMPLETED_COUNT', '{"count":1}'),
  ('trivia_5', 'Explorador de trivias', 'Completa 5 trivias', null, 'TRIVIA_COMPLETED_COUNT', '{"count":5}'),
  ('diagnostic_done', 'Diagnóstico listo', 'Completa tu primer diagnóstico', null, 'DIAGNOSTIC_COMPLETED', '{}'),
  ('news_reader_5', 'Lector curioso', 'Lee 5 noticias', null, 'NEWS_READ_COUNT', '{"count":5}');
-- Nota: agrega TOPIC_MASTERY por tópicos específicos si lo deseas, por ejemplo:
-- insert into public.badges (code, name, description, icon_url, criteria_type, criteria_value)
-- values ('master_clima', 'Maestría en Clima', 'Alcanza 80% en el tema Clima', null, 'TOPIC_MASTERY', '{"topic":"Clima","threshold":80}');

