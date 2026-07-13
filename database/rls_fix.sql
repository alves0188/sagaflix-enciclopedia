ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on books" ON public.books;
CREATE POLICY "Allow all actions for authenticated users on books" ON public.books FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
