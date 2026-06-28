-- ==============================================================================
-- SCHEMA MIGRATION V4: 100% Relational Tables
-- Execute este script no SQL Editor do Supabase para criar as novas tabelas.
-- ==============================================================================

-- 1. Tabela de Solicitações de Autores
CREATE TABLE IF NOT EXISTS public.author_requests (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    about TEXT,
    book_title TEXT,
    synopsis TEXT,
    sample_text TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar políticas
ALTER TABLE public.author_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.author_requests;
CREATE POLICY "Allow select for authenticated users" ON public.author_requests FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.author_requests;
CREATE POLICY "Allow insert for authenticated users" ON public.author_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow all actions for admins" ON public.author_requests;
CREATE POLICY "Allow all actions for admins" ON public.author_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Tabela de Banners
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT,
    action_url TEXT,
    action_text TEXT,
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar políticas
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for everyone" ON public.banners;
CREATE POLICY "Allow select for everyone" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all actions for admins" ON public.banners;
CREATE POLICY "Allow all actions for admins" ON public.banners FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    curator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    curator_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar políticas
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for curators and admins" ON public.audit_logs;
CREATE POLICY "Allow select for curators and admins" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'curator' OR role = 'admin'))
);
DROP POLICY IF EXISTS "Allow insert for curators and admins" ON public.audit_logs;
CREATE POLICY "Allow insert for curators and admins" ON public.audit_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'curator' OR role = 'admin'))
);

-- 4. Tabela de Conquistas (Gamificação)
CREATE TABLE IF NOT EXISTS public.gamification_badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tier TEXT DEFAULT 'bronze',
    xp INTEGER DEFAULT 0,
    icon TEXT,
    bg_color TEXT,
    icon_color TEXT,
    prog_max INTEGER DEFAULT 1,
    trigger_type TEXT
);

-- Habilitar RLS e criar políticas
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for everyone" ON public.gamification_badges;
CREATE POLICY "Allow select for everyone" ON public.gamification_badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all actions for admins" ON public.gamification_badges;
CREATE POLICY "Allow all actions for admins" ON public.gamification_badges FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notificar o PostgREST para recarregar o cache de schema
NOTIFY pgrst, 'reload schema';
