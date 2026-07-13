-- ==============================================================================
-- SAGAFLIX - SCHEMA FINAL V3 (MIGRAÇÃO COMPLETA PARA BANCO RELACIONAL)
-- Execute este script no SQL Editor do Supabase.
-- Ele usa "CREATE TABLE IF NOT EXISTS" e "ADD COLUMN" de forma segura.
-- ==============================================================================

-- 1. BOOKS (Livros)
CREATE TABLE IF NOT EXISTS public.books (
    id text PRIMARY KEY,
    author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    status text DEFAULT 'draft',
    cover_url text,
    sku text,
    synopsis text,
    distribution_mode text,
    book_type text DEFAULT 'complete',
    views integer DEFAULT 0,
    ratings jsonb DEFAULT '[]'::jsonb,
    chapters jsonb DEFAULT '[]'::jsonb,
    co_author_ids jsonb DEFAULT '[]'::jsonb,
    genres jsonb DEFAULT '[]'::jsonb,
    universe_requests jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Forçar a adição de colunas caso a tabela antiga não as tenha
DO $$
BEGIN
    BEGIN ALTER TABLE public.books ADD COLUMN cover_url text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.books ADD COLUMN synopsis text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.books ADD COLUMN distribution_mode text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.books ADD COLUMN book_type text DEFAULT 'complete'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.books ADD COLUMN co_author_ids jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.books ADD COLUMN genres jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.books ADD COLUMN universe_requests jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.books ADD COLUMN chapters jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
END $$;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 2. IDEAS (Painel de Ideias)
CREATE TABLE IF NOT EXISTS public.ideas (
    id text PRIMARY KEY,
    book_id text REFERENCES public.books(id) ON DELETE CASCADE,
    title text,
    text text,
    color text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- 3. ESCALETA (Escaleta / Capítulos)
CREATE TABLE IF NOT EXISTS public.escaleta (
    id text PRIMARY KEY,
    book_id text REFERENCES public.books(id) ON DELETE CASCADE,
    act integer DEFAULT 1,
    title text,
    text text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.escaleta ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- ==============================================================================

-- BOOKS
DROP POLICY IF EXISTS "Allow all actions for authenticated users on books" ON public.books;
CREATE POLICY "Allow all actions for authenticated users on books" ON public.books FOR ALL USING (auth.role() = 'authenticated');

-- IDEAS
DROP POLICY IF EXISTS "Allow all actions for authenticated users on ideas" ON public.ideas;
CREATE POLICY "Allow all actions for authenticated users on ideas" ON public.ideas FOR ALL USING (auth.role() = 'authenticated');

-- ESCALETA
DROP POLICY IF EXISTS "Allow all actions for authenticated users on escaleta" ON public.escaleta;
CREATE POLICY "Allow all actions for authenticated users on escaleta" ON public.escaleta FOR ALL USING (auth.role() = 'authenticated');

-- Atualize também a RLS na tabela Profiles para garantir que possamos ler os profiles
DROP POLICY IF EXISTS "Allow read access to all users" ON public.profiles;
CREATE POLICY "Allow read access to all users" ON public.profiles FOR SELECT USING (true);
