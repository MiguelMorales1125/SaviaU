-- Extensión para UUID
create extension if not exists pgcrypto;

-- 1) Conjunto de trivias (sets)
create table if not exists public.trivia_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  topic text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Preguntas por set
create table if not exists public.trivia_questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.trivia_sets(id) on delete cascade,
  prompt text not null,
  topic text,
  difficulty text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_trivia_questions_set on public.trivia_questions(set_id);

-- 3) Opciones por pregunta (incluye explicación)
create table if not exists public.trivia_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.trivia_questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  explanation text
);
create index if not exists idx_trivia_options_question on public.trivia_options(question_id);

-- 4) Intentos de trivia
create table if not exists public.trivia_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null references public.trivia_sets(id) on delete cascade,
  started_at timestamptz not null,
  completed_at timestamptz,
  score_percent numeric(5,2)
);
create index if not exists idx_trivia_attempts_user on public.trivia_attempts(user_id);
create index if not exists idx_trivia_attempts_set on public.trivia_attempts(set_id);

-- 5) Respuestas por intento
create table if not exists public.trivia_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.trivia_attempts(id) on delete cascade,
  question_id uuid not null references public.trivia_questions(id) on delete restrict,
  selected_option_id uuid not null references public.trivia_options(id) on delete restrict,
  is_correct boolean not null
);
create unique index if not exists uq_trivia_answer_attempt_question on public.trivia_answers(attempt_id, question_id);
create index if not exists idx_trivia_answers_attempt on public.trivia_answers(attempt_id);

-- RLS: Puedes mantener RLS desactivado y usar Service Role desde el backend.
-- Si habilitas RLS, se sugieren policies seguras:
--
-- ALTER TABLE public.trivia_sets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.trivia_options ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.trivia_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.trivia_answers ENABLE ROW LEVEL SECURITY;
--
-- -- Lectura pública de sets/preguntas/opciones (si quieres que el frontend pueda leer sin Service Role)
-- CREATE POLICY "read_public_sets" ON public.trivia_sets
--   FOR SELECT USING (true);
-- CREATE POLICY "read_public_questions" ON public.trivia_questions
--   FOR SELECT USING (true);
-- CREATE POLICY "read_public_options" ON public.trivia_options
--   FOR SELECT USING (true);
--
-- -- Intentos: el usuario solo ve y escribe los suyos
-- CREATE POLICY "user_read_own_attempts" ON public.trivia_attempts
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "user_insert_attempts" ON public.trivia_attempts
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "user_update_own_attempts" ON public.trivia_attempts
--   FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
--
-- -- Respuestas: el usuario solo ve y escribe las de sus intentos
-- CREATE POLICY "user_read_own_answers" ON public.trivia_answers
--   FOR SELECT USING (
--     exists(select 1 from public.trivia_attempts a where a.id = attempt_id and a.user_id = auth.uid())
--   );
-- CREATE POLICY "user_insert_answers" ON public.trivia_answers
--   FOR INSERT WITH CHECK (
--     exists(select 1 from public.trivia_attempts a where a.id = attempt_id and a.user_id = auth.uid())
--   );
-- CREATE POLICY "user_update_answers" ON public.trivia_answers
--   FOR UPDATE USING (
--     exists(select 1 from public.trivia_attempts a where a.id = attempt_id and a.user_id = auth.uid())
--   ) WITH CHECK (
--     exists(select 1 from public.trivia_attempts a where a.id = attempt_id and a.user_id = auth.uid())
--   );

