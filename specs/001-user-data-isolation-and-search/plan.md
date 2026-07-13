# Implementation Plan: User Data Isolation and Search Filters

**Branch**: `001-user-data-isolation-and-search` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-user-data-isolation-and-search/spec.md`

## Summary
Migrate the user database storage from the single shared JSON structure to a secure, relational model in Supabase. Enforce database-level isolation through Row-Level Security (RLS) so that readers, authors, and curators can only access appropriate information. Integrate a third-party payment gateway mock-flow, a user transactions/wallet dashboard, and support tickets. Additionally, implement semantic contextual search by generating Gemini vector embeddings of book content and executing similarity search in Supabase using the `pgvector` extension.

## Technical Context

**Language/Version**: JavaScript (ESM for Vite frontend, CommonJS for `server.cjs` backend)

**Primary Dependencies**: React 19, Express, `@supabase/supabase-js`, `@google/generative-ai` (Gemini API for generating query and document vector embeddings)

**Storage**: Supabase PostgreSQL with `pgvector` extension

**Testing**: Local verification scripts (`test_auth.js`, etc.) and manual integration testing scenarios

**Target Platform**: Vercel (Frontend SPA) + Hostinger/VPS (Backend Express API)

**Project Type**: Fullstack Web Application (monorepo structure)

**Performance Goals**: Semantic search queries return results in under 1.5 seconds. 100% of user profile queries are isolated.

**Constraints**: Banking details are tokenized; no raw account details stored on our databases.

**Scale/Scope**: ~10k mock users, relational tables for profiles, wallets, tastes, transactions, support tickets, and withdrawal requests.

## Constitution Check

- **React + Vite Frontend (Pass)**: Changes to the UI will be implemented in `src/components` and `src/App.jsx` cleanly.
- **Express Backend (Pass)**: Route integrations will be written cleanly inside `server.cjs` or structured router scripts.
- **Supabase Integration (Pass)**: Using proper client libraries and enabling RLS database-level security policy checks.
- **Styling & Premium UX (Pass)**: Dashboard interfaces will use custom CSS matching the encyclopedia's premium visual guidelines.
- **Avoid Context Loss (Pass)**: Specification is finalized, design artifacts created, and implementation plan is documented before coding.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-data-isolation-and-search/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 database schema details
├── quickstart.md        # Run and verification guide
└── contracts/
    └── api.md           # API endpoints contracts
```

### Source Code (repository root)

```text
database/
├── schema_v4_users.sql  # Database migrations and RLS policies setup
server.cjs               # API endpoints, middleware, and embeddings integration
src/
├── components/          # Dashboard components, financial UI, support forms
│   ├── UserDashboard.jsx
│   ├── SearchSection.jsx
│   └── CuratorPanel.jsx
├── App.jsx              # Routing and state setup
package.json             # Gemini AI SDK and package configs
```

**Structure Decision**: Monorepo layout matching the existing project, keeping `server.cjs` in the root and Vite React application code under `src/`.
