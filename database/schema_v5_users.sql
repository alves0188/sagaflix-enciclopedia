-- ENABLE VECTOR EXTENSION
CREATE EXTENSION IF NOT EXISTS vector;

-- CREATE NEW TABLES
CREATE TABLE IF NOT EXISTS public.user_tastes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    genre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'donation_send', 'donation_receive', 'purchase', 'withdrawal')),
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    gateway_ref TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    bank_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ADD EMBEDDINGS COLUMN TO BOOKS TABLE
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS embedding vector(768);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_tastes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR user_tastes
DROP POLICY IF EXISTS "Allow user to manage own tastes" ON public.user_tastes;
CREATE POLICY "Allow user to manage own tastes" ON public.user_tastes
    FOR ALL USING (auth.uid() = user_id);

-- POLICIES FOR wallets
DROP POLICY IF EXISTS "Allow user to read own wallet" ON public.wallets;
CREATE POLICY "Allow user to read own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- POLICIES FOR transactions
DROP POLICY IF EXISTS "Allow user to read own transactions" ON public.transactions;
CREATE POLICY "Allow user to read own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- POLICIES FOR support_tickets
DROP POLICY IF EXISTS "Allow user to manage own tickets" ON public.support_tickets;
CREATE POLICY "Allow user to manage own tickets" ON public.support_tickets
    FOR ALL USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'curator' OR role = 'admin')
    ));

-- POLICIES FOR withdrawal_requests
DROP POLICY IF EXISTS "Allow author to manage own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Allow author to manage own withdrawals" ON public.withdrawal_requests
    FOR ALL USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'curator' OR role = 'admin')
    ));

-- TRIGGER: Automatically create wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance, subscription_status)
    VALUES (NEW.id, 0.00, 'inactive')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_wallet
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();

-- RPC FUNCTION FOR SEMANTIC SEARCH
CREATE OR REPLACE FUNCTION match_books (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  synopsis TEXT,
  author_id UUID,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    books.id,
    books.title,
    books.synopsis,
    books.author_id,
    1 - (books.embedding <=> query_embedding) AS similarity
  FROM books
  WHERE 1 - (books.embedding <=> query_embedding) > match_threshold
  ORDER BY books.embedding <=> query_embedding LIMIT match_count;
$$;

NOTIFY pgrst, 'reload schema';
