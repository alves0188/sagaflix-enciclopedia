-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Atualizar status padrão de leitores e curadores para active
UPDATE public.profiles SET status = 'active' WHERE role = 'reader';
UPDATE public.profiles SET status = 'active' WHERE role = 'admin' OR role = 'curator';

-- Notificar o PostgREST para recarregar o cache
NOTIFY pgrst, 'reload schema';
