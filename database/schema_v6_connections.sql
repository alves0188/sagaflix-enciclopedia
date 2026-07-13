-- CREATE UNIVERSE CONNECTIONS TABLE
DROP TABLE IF EXISTS public.universe_connections CASCADE;

CREATE TABLE public.universe_connections (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL, -- references books.id (stored as TEXT in books)
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('character', 'location', 'organization', 'clue', 'event')),
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('character', 'location', 'organization', 'clue', 'event')),
    relation_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.universe_connections ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES
DROP POLICY IF EXISTS "Allow read of connections for everyone" ON public.universe_connections;
CREATE POLICY "Allow read of connections for everyone" ON public.universe_connections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authors to manage connections" ON public.universe_connections;
CREATE POLICY "Allow authors to manage connections" ON public.universe_connections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = universe_connections.book_id 
            AND books.author_id = auth.uid()
        )
    );
