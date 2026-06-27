-- ==============================================================================
-- PATCH: Adiciona colunas faltantes na tabela books
-- Execute no SQL Editor do Supabase
-- ==============================================================================

DO $$
BEGIN
    BEGIN ALTER TABLE public.books ADD COLUMN sku text; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.books ADD COLUMN views integer DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.books ADD COLUMN chapters jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- Notificar o PostgREST para recarregar o cache de schema
NOTIFY pgrst, 'reload schema';
