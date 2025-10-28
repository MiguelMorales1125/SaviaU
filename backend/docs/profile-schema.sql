-- Esquema de perfil en tabla 'usuarios' (Supabase / Postgres)
-- Ejecutar en el SQL editor de Supabase

-- Tabla base (si no existe)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    full_name text,
    carrera text,
    universidad text,
    semestre int,
    -- Nuevos campos de perfil
    alias text,
    intereses jsonb,
    photo_url text,
    avatar_key text,
    updated_at timestamptz DEFAULT now()
);

-- Para instalaciones existentes: agregar columnas si faltan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='usuarios' AND column_name='alias'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN alias text;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='usuarios' AND column_name='intereses'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN intereses jsonb;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='usuarios' AND column_name='photo_url'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN photo_url text;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='usuarios' AND column_name='avatar_key'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN avatar_key text;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='usuarios' AND column_name='updated_at'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END$$;

-- Bucket de Storage para fotos públicas de perfil
-- Crear bucket manualmente si no existe (en Supabase Storage)
-- Nombre sugerido: profile-photos (coincide con supabase.profileBucket)
-- Habilitar acceso público al bucket.

