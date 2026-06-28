-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE PARA ADICIONAR A COLUNA DE TIPO DE AÇÃO
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'info';

-- Notificar o PostgREST para recarregar o cache do schema
NOTIFY pgrst, 'reload schema';
