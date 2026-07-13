# Research: User Data Isolation and Semantic Search

## Decisions & Rationales

### 1. Database Isolation: Supabase Row-Level Security (RLS)
- **Decision**: Migrate from the single-row JSON (`sagaflix_db` id=1) to a structured relational schema (`profiles`, `wallets`, `transactions`, `support_tickets`, `user_tastes`) and enforce PostgreSQL Row-Level Security (RLS).
- **Rationale**: 
  - Storing all users in a single JSON block leads to data loss (concurrent writes overwriting each other), poor performance, and is a security vulnerability (any client could pull the entire row containing all users).
  - RLS filters data directly in the database engine based on the authenticated user's ID (`auth.uid()`). This prevents data leakages at the lowest level.
- **Alternatives Considered**:
  - *Multi-tenant database schema (one schema/database per user)*: Rejected. Creating a separate database/schema for each user is overkill, expensive, and extremely difficult to migrate or search across.
  - *Application-level isolation*: Rejected. If the backend fails to apply a filter, a user could see others' data. Database-level RLS acts as a permanent guardrail.

### 2. Semantic Search: Supabase `pgvector` + Gemini Embeddings
- **Decision**: Enable the `pgvector` extension on Supabase PostgreSQL. When books/chapters are created/updated, our Express backend generates a 768-dimensional text embedding using the Gemini Embeddings API and saves it in a `vector(768)` column in the database. Queries will be run via a PostgreSQL function using cosine distance (`<=>`).
- **Rationale**: 
  - Allows semantic, context-aware queries (e.g. matching descriptions of plots without requiring literal word matches).
  - Storing vectors in the database itself keeps the stack simple and synchronized.
- **Alternatives Considered**:
  - *Third-party vector database (Pinecone/Weaviate)*: Rejected. Adds infrastructure complexity, cost, and synchronization lag.
  - *Exact Text Match (ILIKE)*: Rejected. Does not satisfy the requirement of finding books by describing the plot (context-based search) without knowing the exact words.

### 3. Financial Transactions: Tokenized Gateway Integration
- **Decision**: Integrate with a third-party payment gateway (Stripe or Asaas) using webhooks to handle subscription payments and credit purchases. The database stores tokenized references and balances (`wallets` and `transactions` tables), rather than raw bank details.
- **Rationale**: 
  - Compliance with PCI-DSS standards.
  - Reduces our liability for holding sensitive financial data.
- **Alternatives Considered**:
  - *In-house banking detail storage*: Rejected. High risk, high legal and compliance requirements, complex encryption.

## Best Practices & Security Gates

1. **Enable RLS on all tables**: Every new table must have RLS active. No table should allow default public read/write access.
2. **Use PostgreSQL Functions (RPC)** for semantic search cosine similarity calculations, as raw vector operations cannot be easily translated by client-side queries.
3. **Webhook verification**: Webhooks from Stripe/Asaas must verify signatures to prevent fraudulent balance top-ups.
