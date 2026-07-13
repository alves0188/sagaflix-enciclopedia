# Data Model: User Data Isolation and Semantic Search

## Tables & Schemas

### 1. `profiles`
Stores user profile information. Linked 1-to-1 with Supabase Auth users.
- `id` (uuid, PK, references `auth.users(id)` on delete cascade)
- `name` (text, not null)
- `nickname` (text, unique, not null)
- `email` (text, unique, not null)
- `role` (text, default 'reader', check in ('reader', 'author', 'curator'))
- `avatar_url` (text, nullable)
- `created_at` (timestamptz, default now())

### 2. `user_tastes`
Stores the genres each user is interested in.
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, FK references `profiles(id)` on delete cascade, not null)
- `genre` (text, not null)

### 3. `wallets`
Stores the active balance and subscription details for each user.
- `user_id` (uuid, PK, references `profiles(id)` on delete cascade)
- `balance` (numeric(10,2), default 0.00, not null)
- `subscription_status` (text, default 'inactive', check in ('active', 'inactive', 'canceled'))
- `subscription_expires_at` (timestamptz, nullable)
- `updated_at` (timestamptz, default now())

### 4. `transactions`
Logs all credit balance movements (deposits, purchases, transfers/donations, withdrawals).
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, FK references `profiles(id)` on delete cascade, not null)
- `type` (text, check in ('deposit', 'donation_send', 'donation_receive', 'purchase', 'withdrawal'))
- `amount` (numeric(10,2), not null)
- `description` (text, nullable)
- `recipient_id` (uuid, FK references `profiles(id)`, nullable) -- for donations
- `gateway_ref` (text, unique, nullable) -- reference ID from Stripe/Asaas
- `status` (text, check in ('pending', 'completed', 'failed'), default 'pending')
- `created_at` (timestamptz, default now())

### 5. `support_tickets`
For complaints, refunds, and support inquiries.
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, FK references `profiles(id)` on delete cascade, not null)
- `subject` (text, not null)
- `message` (text, not null)
- `status` (text, check in ('open', 'resolved', 'closed'), default 'open')
- `created_at` (timestamptz, default now())

### 6. `withdrawal_requests`
Withdrawal requests submitted by authors.
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, FK references `profiles(id)` on delete cascade, not null)
- `amount` (numeric(10,2), not null)
- `bank_token` (text, not null) -- Tokenized/encrypted bank routing metadata
- `status` (text, check in ('pending', 'approved', 'rejected'), default 'pending')
- `created_at` (timestamptz, default now())

### 7. `books` (Updated)
- `id` (uuid, PK, default gen_random_uuid())
- `title` (text, not null)
- `author_id` (uuid, FK references `profiles(id)` on delete cascade, not null)
- `synopsis` (text, not null)
- `embedding` (vector(768)) -- Gemini embeddings column for semantic query matching

---

## Row Level Security (RLS) Policies

### `profiles`
- **Read**: `true` (anyone can view author bios and public names).
- **Insert/Update**: `auth.uid() = id` (users can only edit their own profile).

### `user_tastes`
- **Read/Write**: `auth.uid() = user_id` (users can only manage their own tastes).

### `wallets`
- **Read**: `auth.uid() = user_id` (users can only view their own wallet balance).
- **Write**: `false` (updates must be done via database RPC functions or secure server-side role to prevent users from editing their own balance directly).

### `transactions`
- **Read**: `auth.uid() = user_id` (users can only view their own transaction history).
- **Write**: `false` (inserts must be done by secure backend webhooks or system functions).

### `support_tickets`
- **Read/Write (Users)**: `auth.uid() = user_id` (users see/edit their own tickets).
- **Read/Write (Curators)**: `exists (select 1 from profiles where id = auth.uid() and role = 'curator')` (curators can view and update all tickets).

### `withdrawal_requests`
- **Read/Write (Authors)**: `auth.uid() = user_id` (authors see/create their own requests).
- **Read/Write (Curators)**: `exists (select 1 from profiles where id = auth.uid() and role = 'curator')` (curators approve/reject requests).
