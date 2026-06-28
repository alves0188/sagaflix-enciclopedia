-- ==============================================================================
-- PATCH: RLS Policies for Profiles Table
-- Execute este script no SQL Editor do Supabase para corrigir o erro de cadastro.
-- ==============================================================================

-- 1. Habilitar RLS na tabela Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Permitir leitura para todos (necessário para listar autores e leitores)
DROP POLICY IF EXISTS "Allow read access to all users" ON public.profiles;
CREATE POLICY "Allow read access to all users" ON public.profiles FOR SELECT USING (true);

-- 3. Permitir inserção para todos (necessário durante o cadastro de novas contas)
DROP POLICY IF EXISTS "Allow insert for everyone" ON public.profiles;
CREATE POLICY "Allow insert for everyone" ON public.profiles FOR INSERT WITH CHECK (true);

-- 4. Permitir atualização apenas do próprio perfil
DROP POLICY IF EXISTS "Allow update for owners" ON public.profiles;
CREATE POLICY "Allow update for owners" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Notificar o PostgREST para recarregar o cache de schema
NOTIFY pgrst, 'reload schema';
