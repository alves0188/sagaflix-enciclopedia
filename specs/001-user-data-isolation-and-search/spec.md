# Feature Specification: User Data Isolation and Search Filters

**Feature Branch**: `001-user-data-isolation-and-search`

**Created**: 2026-07-12

**Status**: Ready for Planning

**Input**: User description: "Eu preciso de um banco de dados mais confiavel e separado pr usuário... teremos no futuro compras dentro da plataforma, então seiria muito bom que cada usuário difesse seu db especifico com suas informações particulares salvas, incluido seus gostos na plataforma, leitura, tudo... e preciso de privacidade para cada usuário, visto que dados pessoais e contas bancárias serão exisgidos muito embreves, sem contar que precisamos melhoras nossos filtros de buscas na plataforma."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Isolated User Profile & Preferences (Priority: P1)

Como usuário (Leitor ou Autor) da plataforma, eu quero que minhas informações pessoais, preferências de leitura (gostos) e histórico sejam salvos de forma independente, para que meus dados estejam seguros e minhas sugestões personalizadas funcionem corretamente.

**Why this priority**: Crucial for starting user database separation and migrating away from the single shared JSON structure.

**Independent Test**: Register a new user, update their profile tastes, and verify that no other registered user can see or retrieve those tastes via the API or database.

**Acceptance Scenarios**:

1. **Given** a registered user logged in, **When** they update their literary genres tastes, **Then** the tastes are saved to their private record.
2. **Given** another logged-in user, **When** they query their profile, **Then** they cannot see or modify the first user's tastes or profile details.

---

### User Story 2 - User Wallet, Subscription, and Transaction Dashboard (Priority: P1)

Como usuário, eu quero uma área de controle (dashboard) onde eu possa gerenciar minha assinatura mensal (R$ 14,90), ver meu saldo de créditos, realizar doações para autores e adquirir projetos premium, bem como abrir chamados de suporte para reembolso ou reclamações.

**Why this priority**: Essential to support future purchase transactions and guarantee compliance with data privacy regulations without storing raw banking details.

**Independent Test**: Add credits to User A's wallet, verify that the transaction is logged, and test that User A can open a refund ticket linked to that transaction which is visible only to User A and curators.

**Acceptance Scenarios**:

1. **Given** a third-party payment gateway transaction confirmation, **When** the system processes it, **Then** the user's credits balance is updated in their secure wallet table, and a secure transaction log is created.
2. **Given** a user with a balance, **When** they donate credits to an author, **Then** the sender's balance decreases, the author's balance increases, and a transfer log is created.
3. **Given** a transaction issue, **When** the user opens a refund ticket from their dashboard, **Then** the ticket is routed to the curator panel and remains private to that user and curators.

---

### User Story 3 - Author Withdrawal System (Priority: P1)

Como autor na plataforma, eu quero poder visualizar meus créditos acumulados por doações/vendas e solicitar saques para minha conta bancária (processada externamente), acompanhando o status do pedido.

**Why this priority**: Necessary to monetize content creators and retain authors.

**Independent Test**: Request a withdrawal as an author, and verify that curators receive the request with the correct bank routing destination token, and the author's pending withdrawal status updates.

**Acceptance Scenarios**:

1. **Given** an author with credit balance, **When** they request a withdrawal, **Then** the requested credits are marked as pending, and a withdrawal request is generated for curators.

---

### User Story 4 - Semantic and Contextual Search (Priority: P2)

Como usuário navegando pela plataforma, eu quero poder pesquisar livros/artigos descrevendo o enredo, contexto ou um trecho que eu me lembre, mesmo sem saber o nome exato da obra ou do autor, para encontrar conteúdos de forma inteligente.

**Why this priority**: Differentiates the encyclopedia search experience from basic substring search, catering to users with vague memories of books.

**Independent Test**: Search for a plot query (e.g., "menino loiro que vive na lua e faz amizade com uma raposa") and verify that "O Pequeno Príncipe" (or equivalent plot-matching book) is returned in the top results even if those exact words do not exist in the title.

**Acceptance Scenarios**:

1. **Given** a search query containing context description, **When** the semantic search engine processes it, **Then** it calculates semantic similarity against book summaries/chapters and returns relevant matches.

---

## Edge Cases

- **Cascading deletion**: What happens if a user deletes their account? (Cascading deletion of all private profile data, wallet balance logs, transaction logs, and support tickets must occur).
- **Payment gateway timeout**: What happens if the third-party gateway fails to notify the server? (Transactions remain as pending, and the user can trigger manual refresh/support ticket).
- **Vague/No-match semantic query**: What happens if a semantic query has a low similarity score? (Return a friendly message: "Não encontramos histórias com este enredo. Tente descrever outros detalhes!").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **Relational Schema Migration**: The system MUST migrate user accounts out of the single-row JSON configuration (`sagaflix_db` where `id = 1`) into separate relational database tables (`profiles`, `wallets`, `transactions`, `support_tickets`, `user_tastes`).
- **FR-002**: **Row-Level Security (RLS)**: The database (Supabase) MUST enforce policies where each user can only read and write their own row in profiles, wallets, transactions, and support tickets tables.
- **FR-003**: **Third-Party Payment Gateway Integration**: The system MUST integrate with an external payment gateway (e.g., Stripe, Asaas) for subscriptions, credit purchases, and withdrawals, preventing raw banking details from being stored in our database.
- **FR-004**: **User Financial Dashboard**: The frontend MUST present a dashboard showing subscription status, wallet balance, transaction logs, and a form to request withdrawals (for authors) or open support tickets.
- **FR-005**: **Semantic Search Engine**: The system MUST support semantic/contextual search queries by calculating similarity embeddings (using a model/API like Gemini Embeddings or pgvector on Supabase) over book descriptions, summaries, and chapters.
- **FR-006**: **Curator Support Panel**: The admin panel MUST allow curators to view, process, and update the status of support/refund tickets and withdrawal requests.

### Key Entities

- **Profile**: Basic user details (id, name, email, avatar, role: author/reader/curator).
- **Wallet**: User's active credit balance and subscription status.
- **Transaction**: Log of all credit purchases, donations, and purchases.
- **SupportTicket**: Support tickets for refunds, claims, or general help.
- **WithdrawalRequest**: Withdrawal requests submitted by authors.
- **Book/Article**: Books and chapters, including stored text embeddings for semantic search.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of personal, financial, and wallet requests are isolated via RLS; zero unauthorized cross-user reads occur.
- **SC-002**: Semantic search queries return results with relevant matches in under 1.5 seconds.
- **SC-003**: Subscription status changes and wallet balance updates are executed as transactional row-level updates, eliminating concurrent write locks.

## Assumptions

- We assume Supabase PostgreSQL database will run the `pgvector` extension or we will use a separate backend embedding vector store to calculate plot similarities.
- We assume that external payment processing hooks (webhooks) will securely update transaction status on our Express backend.
