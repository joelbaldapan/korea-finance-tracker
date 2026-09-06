# System Architecture & Implementation Plan: Multi-Currency Finance Tracker

## 0. AGENTIC DIRECTIVE (CRITICAL)
Before executing any code generation, you MUST read all markdown files located in `.agents/skills/`. Strictly enforce these patterns for TypeScript, Hono, Supabase, and React PWA design. Do not proceed until you have acknowledged these rules.

## 1. Project Context & Stack
*   **Monorepo Structure:** 
    *   `/apps/api` (Hono, Node/Bun, TypeScript)
    *   `/apps/web` (React, Vite, Tailwind, PWA)
*   **Database:** PostgreSQL (Supabase) with RLS.
*   **Integrations:** Gemini 2.5 Flash (`@google/genai`), Kakao Local API, Frankfurter FX API.

## 2. Environment Variables (`.env.example`)
Generate the `.env` templates for both apps:
```env
# /apps/api/.env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
KAKAO_REST_API_KEY=
API_BEARER_TOKEN= # Used by iOS Shortcuts/MacroDroid to authenticate ingestion

# /apps/web/.env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

## 3. Database Schema (Supabase)
Generate a migration file `/apps/api/supabase/migrations/0001_init.sql`. Include the `transactions` table with dual-currency columns (KRW, PHP, FX rate), merchant info (raw_merchant, hangul_name, category, is_online), and geospatial data (device_lat, device_lng, merchant_lat, merchant_lng, address). **You must include Row Level Security (RLS) policies restricting SELECT, INSERT, UPDATE, DELETE to `auth.uid() = user_id`.**

## 4. Software Design & SOLID Principles (MANDATORY)
You are strictly forbidden from writing monolithic route handlers. The backend must strictly follow these object-oriented and clean architecture principles:

### A. Single Responsibility Principle (SRP)
Organize `/apps/api/src` into discrete architectural layers:
*   `controllers/`: Request handling, validation, and HTTP response formatting.
*   `parsers/`: Parsing raw text into structured tokens. No database or external network I/O permitted here.
*   `services/`: Domain business logic (FX conversions, AI normalization, Kakao geocoding).
*   `repositories/`: Database CRUD operations isolating Supabase queries.

### B. Open/Closed Principle (OCP) & Strategy Pattern
The ingestion engine must be closed for modification but open for extension:
*   Define an interface `ITransactionParser`:
    ```typescript
    export interface ParsedTransaction {
      rawMerchant: string;
      originalCurrency: 'KRW' | 'PHP';
      originalAmount: number;
      transactedAt: Date;
    }

    export interface ITransactionParser {
      canHandle(source: string): boolean;
      parse(rawBody: string, fallbackDate: Date): ParsedTransaction;
    }
    ```
*   Implement `MariBankParser implements ITransactionParser`.
*   Build a `ParserFactory` or registry that selects the correct parser at runtime based on `source`. Adding a new provider (e.g., `GCashParser`) must never require altering existing parsers or the pipeline orchestrator.

### C. Dependency Inversion Principle (DIP) & Interface Segregation (ISP)
*   Define clear interfaces: `IFxRateService`, `IMerchantEnricher`, and `ITransactionRepository`.
*   Inject dependencies into service constructors rather than instantiating global singletons inside route functions.

## 5. Backend Ingestion API (`/apps/api`)
Create `POST /api/v1/transactions/ingest`.
*   **Validation:** Use `zod` via `@hono/zod-validator` to validate the incoming JSON payload (source, raw_body, timestamp, device_location).
*   **Auth Middleware:** Require `Authorization: Bearer <API_BEARER_TOKEN>`.

### Execution Pipeline:
1.  **Parse:** Identify strategy via `ParserFactory` and extract `original_amount`, `original_currency`, and `raw_merchant`.
2.  **Convert:** Query `IFxRateService` for the exchange rate on the transaction date and calculate both KRW and PHP amounts.
3.  **LLM Normalization:** Use `IMerchantEnricher` (calling Gemini 2.5 Flash with strict JSON schema) to resolve `{ cleanStoreName, hangulName, category, isOnline }`.
4.  **Geocoding:** If `!isOnline` and device coords exist, query Kakao Local keyword search API using `hangulName` and device coordinates `(x, y)`. Fallback to SeoulTech campus coordinates (`lat: 37.631825, lng: 127.077582`) if device coordinates are absent.
5.  **Persist:** Write through `ITransactionRepository`.

### Test Data (Include in automated tests):
*   `Merchant: SSIYU GUAHAKGISOOLDAES` -> CU 서울과학기술대
*   `Merchant: (JOO)SSIAENCOCUMPUNIBL` -> 블루포트 (C&Co Company)
*   `Merchant: NHN TICKETLINK` -> `isOnline: true`

## 6. Frontend PWA (`/apps/web`)
Build a mobile-first web app using React and Tailwind CSS.
*   **Auth:** Supabase Email/Password or Google OAuth login screen.
*   **Data Fetching:** Use `@tanstack/react-query` for cached, optimistic queries. No raw `useEffect` fetches.
*   **Dashboard:** Total spent this month in KRW and PHP.
*   **Feed:** Scrollable list of transactions showing `cleanStoreName`, `category`, and amounts.
*   **PWA Config:** Configure `vite-plugin-pwa` for mobile home screen installation.

## 7. Execution Phases
Execute this project in the following strict order. Pause and wait for user approval after each phase:
1.  **Phase 1: Project Setup.** Monorepo scaffolding (`/apps/api`, `/apps/web`), dependencies, and `.env.example`.
2.  **Phase 2: Database & Auth.** Supabase SQL migration, RLS policies, and TypeScript database types.
3.  **Phase 3: Backend API & Strategy Pipeline.** Interfaces, `MariBankParser`, services (FX, Gemini, Kakao), Hono routes, and test suite.
4.  **Phase 4: Frontend UI & PWA.** React components, React Query hooks, feed view, and PWA manifest.