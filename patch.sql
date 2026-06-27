ALTER TABLE public.universe_items ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.universe_items ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.universe_items ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.universe_items ADD COLUMN IF NOT EXISTS private_notes text;
