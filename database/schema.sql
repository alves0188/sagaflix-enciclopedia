-- ==============================================================================
-- SAGAFLIX - MIGRAÇÃO PARA BANCO RELACIONAL (SUPABASE)
-- V2: Ajustado para usar TEXT nas chaves primárias e estrangeiras
-- ==============================================================================

-- 1. BOOKS (Livros) 
-- (Se a tabela já existir, este comando será ignorado e não dará erro)
CREATE TABLE IF NOT EXISTS public.books (
    id text PRIMARY KEY,
    author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    status text DEFAULT 'DRAFT',
    cover text,
    sku text,
    premissa text,
    views integer DEFAULT 0,
    ratings jsonb DEFAULT '[]'::jsonb,
    chapters jsonb DEFAULT '[]'::jsonb,
    co_authors jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 2. BOOK IDEAS (Painel de Ideias)
CREATE TABLE IF NOT EXISTS public.book_ideas (
    id text PRIMARY KEY,
    book_id text REFERENCES public.books(id) ON DELETE CASCADE,
    title text,
    text text,
    color text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.book_ideas ENABLE ROW LEVEL SECURITY;

-- 3. BOOK ESCALETA (Escaleta / Capítulos)
CREATE TABLE IF NOT EXISTS public.book_escaleta (
    id text PRIMARY KEY,
    book_id text REFERENCES public.books(id) ON DELETE CASCADE,
    act integer DEFAULT 1,
    title text,
    text text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.book_escaleta ENABLE ROW LEVEL SECURITY;

-- 4. UNIVERSE ITEMS (Personagens, Locais, Organizações, Itens)
CREATE TABLE IF NOT EXISTS public.universe_items (
    id text PRIMARY KEY,
    book_id text REFERENCES public.books(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'personagem', 'local', 'organizacao', 'item'
    name text NOT NULL,
    role text,
    age integer,
    territory text,
    image text,
    description text,
    motivations text,
    curiosities text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.universe_items ENABLE ROW LEVEL SECURITY;

-- 5. UNIVERSE CONNECTIONS (Conexões do Dossiê)
CREATE TABLE IF NOT EXISTS public.universe_connections (
    id text PRIMARY KEY,
    item_id text REFERENCES public.universe_items(id) ON DELETE CASCADE,
    name text NOT NULL,
    relation text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.universe_connections ENABLE ROW LEVEL SECURITY;

-- 6. AUTHOR NOTES (Notas do Autor)
CREATE TABLE IF NOT EXISTS public.author_notes (
    id text PRIMARY KEY,
    item_id text REFERENCES public.universe_items(id) ON DELETE CASCADE,
    author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.author_notes ENABLE ROW LEVEL SECURITY;

-- 7. NOTE FEEDBACK (Curtidas/Descurtidas nas notas)
CREATE TABLE IF NOT EXISTS public.note_feedback (
    id text PRIMARY KEY,
    note_id text REFERENCES public.author_notes(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'like' ou 'dislike'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, user_id)
);
ALTER TABLE public.note_feedback ENABLE ROW LEVEL SECURITY;

-- 8. SUPPORT TICKETS (Pedidos dos Leitores para os Autores)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id text PRIMARY KEY,
    book_id text REFERENCES public.books(id) ON DELETE CASCADE,
    author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reader_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    status text DEFAULT 'open',
    reply text,
    inbox_type text DEFAULT 'universe',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security) - PERMISSÃO PARA TODOS
-- ==============================================================================

CREATE POLICY "Allow all actions for authenticated users on books" ON public.books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users on book_ideas" ON public.book_ideas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users on book_escaleta" ON public.book_escaleta FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users on universe_items" ON public.universe_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users on universe_connections" ON public.universe_connections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users on author_notes" ON public.author_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users on note_feedback" ON public.note_feedback FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users on support_tickets" ON public.support_tickets FOR ALL USING (auth.role() = 'authenticated');
