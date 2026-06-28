-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE PARA CORRIGIR AS PERMISSÕES RLS (UPSET/UPDATE)

-- 1. Tabela de Banners
DROP POLICY IF EXISTS "Allow all actions for admins" ON public.banners;
DROP POLICY IF EXISTS "Allow all actions for admins_curators" ON public.banners;
CREATE POLICY "Allow all actions for admins_curators" ON public.banners FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')));

-- 2. Tabela de Logs de Auditoria (Permitir ALL para que o upsert do frontend funcione)
DROP POLICY IF EXISTS "Allow select for curators and admins" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert for curators and admins" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all actions for curators and admins" ON public.audit_logs;
CREATE POLICY "Allow all actions for curators and admins" ON public.audit_logs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')));

-- 3. Tabela de Conquistas (Gamificação)
DROP POLICY IF EXISTS "Allow all actions for admins" ON public.gamification_badges;
DROP POLICY IF EXISTS "Allow all actions for admins_curators" ON public.gamification_badges;
CREATE POLICY "Allow all actions for admins_curators" ON public.gamification_badges FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')));

-- 4. Tabela de Pedidos de Autor
DROP POLICY IF EXISTS "Allow all actions for admins" ON public.author_requests;
DROP POLICY IF EXISTS "Allow all actions for admins_curators" ON public.author_requests;
CREATE POLICY "Allow all actions for admins_curators" ON public.author_requests FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'curator')));

-- Notificar o PostgREST para recarregar o cache
NOTIFY pgrst, 'reload schema';
