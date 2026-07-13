# Tasks: User Data Isolation and Search Filters

**Input**: Design documents from `/specs/001-user-data-isolation-and-search/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Test tasks are included as validation scripts to verify RLS policies and API connectivity.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Create database SQL migration file at `database/schema_v5_users.sql`
- [x] T002 [P] Install Google Generative AI dependency in `package.json` for embeddings generation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Define `wallets`, `transactions`, `support_tickets`, `withdrawal_requests`, and `user_tastes` tables in `database/schema_v5_users.sql`
- [x] T004 Enable and configure Row-Level Security (RLS) on new tables in `database/schema_v5_users.sql`
- [x] T005 Implement backfill and migration script at `scripts/migrate_to_relational.js` to transfer existing user tastes and details from `data.json` to Supabase
- [x] T006 Configure database triggers in `database/schema_v5_users.sql` to automatically create a profile and wallet row when a new user signs up


**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Isolated User Profile & Preferences (Priority: P1) 🎯 MVP

**Goal**: Establish logical user profile separation via Supabase RLS and save user tastes in a separate relational table.

**Independent Test**: Register a new user, save their tastes, and confirm that only they can view or modify them.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create RLS security policies for `profiles` and `user_tastes` in `database/schema_v5_users.sql`
- [x] T008 [US1] Implement user tastes retrieval and update endpoints `GET /api/profile/tastes` and `POST /api/profile/tastes` in `server.cjs`
- [x] T009 [US1] Integrate profile tastes reading and writing in `src/contexts/AuthContext.jsx` with the new backend API endpoints

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - User Wallet, Subscription, and Transaction Dashboard (Priority: P1)

**Goal**: Implement payment gateway mock integration, wallet balances, transaction logs, and a dashboard to view them and open support tickets.

**Independent Test**: Simulate a payment deposit, verify the credit balance updates, and check that a user can open support tickets visible only to them and curators.

### Implementation for User Story 2

- [x] T010 [US2] Implement payment webhook processor endpoint `POST /api/wallet/webhook` in `server.cjs` to receive mock payment signals from gateways
- [x] T011 [US2] Implement credit balance query endpoint `GET /api/wallet/balance` in `server.cjs` with user authentication
- [x] T012 [US2] Implement credit donation transfer endpoint `POST /api/wallet/donate` in `server.cjs` with balance checking
- [x] T013 [US2] Implement support ticket creation and list endpoints `POST /api/support/ticket` and `GET /api/support/tickets` in `server.cjs`
- [x] T014 [US2] Create wallet transactions and support interface in `src/components/UserDashboard.jsx`
- [x] T015 [US2] Connect UserDashboard component to `src/App.jsx` routes

**Checkpoint**: User Stories 1 and 2 are fully functional and integrated.

---

## Phase 5: User Story 3 - Author Withdrawal System (Priority: P1)

**Goal**: Allow authors to request withdrawals and curators to approve/reject requests and support tickets.

**Independent Test**: Request a withdrawal as an author, view it in the curator panel, approve it, and check that the author's balance updates accordingly.

### Implementation for User Story 3

- [x] T016 [US3] Implement withdrawal request endpoint `POST /api/wallet/withdraw` and query endpoint `GET /api/wallet/withdrawals` in `server.cjs`
- [x] T017 [US3] Create withdrawal request form and status tracker in `src/components/UserDashboard.jsx` (under Author tab view)
- [x] T018 [US3] Implement support ticket resolution and withdrawal approvals panel in `src/components/AdminPanel.jsx` (under Curator view)

**Checkpoint**: Payouts, withdrawals, and curator administrative tasks are fully functional.

---

## Phase 6: User Story 4 - Semantic and Contextual Search (Priority: P2)

**Goal**: Implement smart semantic plot search using Gemini Embeddings and pgvector.

**Independent Test**: Query describing a book plot (e.g. "menino loiro na lua") and verify that correct matching stories return in under 1.5 seconds.

### Implementation for User Story 4

- [x] T019 [US4] Configure pgvector extension and cosine similarity search database function in `database/schema_v5_users.sql`
- [x] T020 [US4] Add text embedding generation helper in `server.cjs` using `@google/generative-ai`
- [x] T021 [US4] Create a script at `scripts/backfill_embeddings.js` to calculate and backfill vector embeddings for all existing books in the database
- [x] T022 [US4] Implement semantic search endpoint `GET /api/search` in `server.cjs` using pgvector query functions
- [x] T023 [US4] Create search page component in `src/components/SearchSection.jsx` to trigger semantic queries

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final security review, validation checks, and documentation cleanup.

- [x] T024 Run all verification scenarios defined in `quickstart.md`
- [x] T025 Remove old mock database backup files if no longer needed


---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. Blocks all user stories.
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion. Can be worked on sequentially or in parallel.
- **Polish (Phase 7)**: Depends on all user stories being complete.

---

## Parallel Example: User Story 1

```bash
# Launch RLS configuration and backend endpoint creation in parallel:
Task: "Create RLS security policies for profiles and user_tastes in database/schema_v5_users.sql"
Task: "Implement user tastes retrieval and update endpoints GET /api/profile/tastes and POST /api/profile/tastes in server.cjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Critical - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify profiles and tastes RLS separation.
5. Deploy database migrations.
