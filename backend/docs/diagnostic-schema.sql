-- Extensión para UUID (si no está habilitada)
create extension if not exists pgcrypto;

-- 1) Ampliar tabla de perfiles de usuario
alter table if exists public.usuarios
  add column if not exists has_completed_diagnostic boolean default false,
  add column if not exists diagnostic_level text,
  add column if not exists diagnostic_completed_at timestamptz;

-- 2) Preguntas del diagnóstico
create table if not exists public.diagnostic_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  topic text not null,
  difficulty text, -- opcional: Beginner/Intermediate/Advanced o 1/2/3
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3) Opciones de respuesta por pregunta
create table if not exists public.diagnostic_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.diagnostic_questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false
);
create index if not exists idx_diag_opts_question on public.diagnostic_options(question_id);

-- 4) Intentos del diagnóstico
create table if not exists public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  completed_at timestamptz,
  score_percent numeric(5,2),
  level text
);
create index if not exists idx_diag_attempts_user on public.diagnostic_attempts(user_id);
create index if not exists idx_diag_attempts_completed_at on public.diagnostic_attempts(completed_at desc);

-- 5) Respuestas por intento
create table if not exists public.diagnostic_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.diagnostic_attempts(id) on delete cascade,
  question_id uuid not null references public.diagnostic_questions(id) on delete restrict,
  selected_option_id uuid not null references public.diagnostic_options(id) on delete restrict,
  is_correct boolean not null
);
create index if not exists idx_diag_answers_attempt on public.diagnostic_answers(attempt_id);
create index if not exists idx_diag_answers_question on public.diagnostic_answers(question_id);

-- Notas RLS/Supabase:
-- - Puedes mantener RLS desactivado en estas tablas si solo las accede el backend con Service Role.
-- - Si habilitas RLS, crea policies que permitan a Service Role (o al backend) leer/escribir
--   y opcionalmente a los usuarios leer sus propios intentos.

-- Datos de ejemplo (opcional)
-- insert into public.diagnostic_questions (prompt, topic, difficulty) values
-- ('¿Cuál es el gas de efecto invernadero más abundante?', 'Clima', 'Beginner'),
-- ('¿Qué es la huella de carbono?', 'Consumo', 'Beginner');
-- insert into public.diagnostic_options (question_id, text, is_correct)
-- select q.id, o.text, o.is_correct
-- from (values
--   ('¿Cuál es el gas de efecto invernadero más abundante?', 'Vapor de agua', true),
--   ('¿Cuál es el gas de efecto invernadero más abundante?', 'CO2', false),
--   ('¿Qué es la huella de carbono?', 'La cantidad de CO2 equivalente emitida por actividades', true),
--   ('¿Qué es la huella de carbono?', 'La cantidad de residuos sólidos generados', false)
-- ) as o(prompt, text, is_correct)
-- join public.diagnostic_questions q on q.prompt = o.prompt;
