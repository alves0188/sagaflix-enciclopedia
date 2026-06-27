ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS synopsis text,
ADD COLUMN IF NOT EXISTS distribution_mode text,
ADD COLUMN IF NOT EXISTS book_type text DEFAULT 'complete',
ADD COLUMN IF NOT EXISTS universe_requests jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lore_areas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS genres jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS typesetting_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.book_ideas
ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
