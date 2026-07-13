# Quickstart: User Data Isolation and Semantic Search

This guide details how to verify the database migration, row-level security, and semantic search implementation in your local environment.

## 1. Database Setup

To configure Supabase with the new relational schema, RLS policies, and semantic search capability, run the SQL migrations from the admin panel:

1. Enable the vector extension:
   ```sql
   create extension if not exists vector;
   ```
2. Apply the table schemas (defined in [data-model.md](../data-model.md)).
3. Enable RLS on all tables:
   ```sql
   alter table profiles enable row level security;
   alter table user_tastes enable row level security;
   alter table wallets enable row level security;
   alter table transactions enable row level security;
   alter table support_tickets enable row level security;
   alter table withdrawal_requests enable row level security;
   ```
4. Define RLS security policies for users and curators (as documented in `data-model.md`).

## 2. Server Startup

Start the local development server:
```bash
npm run dev
```

The Express API server (`server.cjs`) will run on port `5000` (or the configured `.env` port).

## 3. Verification Scenarios

### Scenario A: Verify Row-Level Security Isolation (RLS)
1. Register two users (`User A` and `User B`).
2. Log in as `User A` and obtain the JWT token.
3. Fetch wallet details via API `GET /api/wallet/balance`. Verify you receive User A's balance.
4. Try to query the database table `wallets` directly using `User A`'s key, targetting `User B`'s UUID. Verify that Supabase returns empty rows or access denied.

### Scenario B: Verify Semantic Search
1. Insert a test book with title "O Pequeno Príncipe" and a description about "menino loiro na lua, raposa e rosa".
2. Generate its vector embedding via backend and save it.
3. Query the `/api/search?q=garoto dourado vivendo no espaco com flor` endpoint.
4. Verify that "O Pequeno Príncipe" is returned in the search results with a high similarity score, proving the semantic matching engine works.
