# Fish&Fric (remastered)

[![CI](https://github.com/RomainBoiret/FishFric-remastered/actions/workflows/ci.yml/badge.svg)](https://github.com/RomainBoiret/FishFric-remastered/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Live demo:** [fish-fric-remastered-8ag2.vercel.app](https://fish-fric-remastered-8ag2.vercel.app) · in-app story at [`/docs`](https://fish-fric-remastered-8ag2.vercel.app/docs)

Full-stack remaster of **Fish&Fric**, an ocean-themed online banking demo for recruiters: accounts, transfers, P2P, bill pay, and **HMAC-signed cheque deposits** on a cent-based ledger.

> **Fictional data only.** All users, balances, transfers, and transactions are fake. Do not enter real banking credentials or personal financial information.

## Story

| | |
|---|---|
| **2024** | Original **ÉTS integrator team project** — [FishFric-Bank](https://github.com/RomainBoiret/FishFric-Bank) |
| **2026** | Solo remaster — this repo |
| **Now** | Live demo with a stricter domain layer, notifications, and one-time cheque clearing |

## Try it in 60 seconds

1. Open the [live demo](https://fish-fric-remastered-8ag2.vercel.app)
2. Click **Try the demo** (or use the credentials below)
3. Transfer between accounts, accept the pending bottle drop (answer: `shark`), then try the signed cheque flow on **Deposit a cheque**
4. If the reef looks messy, use **Reset demo reef** on `/app` (demo user only)

| Account | Email | Password |
|---------|-------|----------|
| Demo | `demo@fishfric.app` | `Demo-FishFric-2026!` |
| Friend (P2P) | `ami@fishfric.app` | `Demo-FishFric-2026!` |

## Highlights

| Feature | What it does |
|---------|----------------|
| Accounts | Checking, savings, Shark Card (open rules enforced) |
| Transfers | Double-entry ledger writes between your own accounts |
| P2P | Send funds locked behind a security question |
| Bill pay | Demo payees → `BILL_PAYMENT` ledger entries |
| Cheque deposit | Server-issued SVG, payee + HMAC + one-time clear |
| Alerts & history | Capped inbox / histories: dismiss one or clear all |

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** (Neon) + **Prisma**
- **Auth.js** (credentials + JWT sessions)
- Lightweight domain layer (`src/domain`) with an **append-only ledger** (by app convention)

## How money moves

`BankAccount.balanceCents` is a denormalized cache. New movements append signed `LedgerEntry` rows (amounts in cents). Conditional updates keep concurrent debits / one-shot cheque clears honest under load.

```mermaid
flowchart LR
  A[Server action] --> B{Validate domain rules}
  B -->|ok| C["$transaction"]
  C --> D[Append LedgerEntry rows]
  C --> E[Conditional balance / status update]
  E --> F[Cached balanceCents]
  D --> G["db:verify-ledger Σ entries"]
  F --> G
```

Cheque catch (demo):

```mermaid
sequenceDiagram
  participant U as Demo user
  participant S as Server
  participant DB as Postgres
  U->>S: Issue signed cheque
  S->>DB: Insert ChequeInstrument + HMAC
  S-->>U: Download SVG
  U->>S: Submit deposit
  S->>DB: updateMany CLEARED where unused
  alt first clear wins
    S->>DB: Append MOBILE_DEPOSIT ledger + credit
  else already cleared
    S-->>U: Reject double-cash
  end
```

## Local setup

```bash
cp .env.example .env
# Set DATABASE_URL, DIRECT_URL, and AUTH_SECRET

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests & quality

| Command | What it covers |
|---------|----------------|
| `npm test` | Pure domain / lib unit tests (no database) |
| `npm run test:integration` | Postgres money paths (needs `TEST_DATABASE_URL`) |
| `npm run test:e2e` | Playwright: **smoke** (login, transfer, P2P, surfaces, reset) + **signed cheque** (issue → download → deposit → reject double-cash) |
| `npm run db:verify-ledger` | Every account: `balanceCents === Σ LedgerEntry` |

```bash
# Pure domain / lib unit tests (no database)
npm test

# Integration tests against Postgres (requires TEST_DATABASE_URL + migrations)
# Example: TEST_DATABASE_URL=postgresql://fishfric:fishfric@localhost:5432/fishfric_test
npm run db:migrate:deploy
npm run test:integration

# Recruiter smoke + signed-cheque E2E (Playwright)
# Needs a seeded DB + AUTH_SECRET (+ CRON_SECRET for API reset in tests)
# Prefer a dedicated local DB; CI uses Postgres service + migrate + seed + verify-ledger + build
npm run test:e2e

# Reconcile every account against Σ LedgerEntry (needs DATABASE_URL)
npm run db:verify-ledger
```

CI (`.github/workflows/ci.yml`) on PR / `main`: lint, typecheck, unit tests, Postgres integration, Playwright (smoke + one-shot cheque), and `db:verify-ledger` after the E2E seed.

## Deploy (Vercel)

1. Import this repo on [vercel.com](https://vercel.com)
2. Set environment variables:
   - `DATABASE_URL` — Neon **pooled** URL (host includes `-pooler`)
   - `DIRECT_URL` — Neon **direct** URL (same credentials, host **without** `-pooler`) — required for migrations
   - `AUTH_SECRET` — Auth.js + cheque HMAC secret
   - `CRON_SECRET` — protects demo reset cron / API
   - Optional: `NEXT_PUBLIC_SITE_URL` — canonical production URL
3. Deploy — `npm run build` only generates the Prisma client and builds Next.js (**no migrations** during build)
4. Apply schema changes separately via [Migrate production](./.github/workflows/migrate-production.yml) (or `npm run db:migrate:deploy`)
5. Seed once: `npm run db:seed`

### Demo reef reset

Shared demo accounts can drift as visitors explore. Three ways to restore them:

1. **In-app** — signed in as the demo user, **Reset demo reef** on `/app`
2. **Cron** — `vercel.json` hits `POST /api/demo/reset` daily (12:00 UTC). Set `CRON_SECRET` on Vercel
3. **CLI** — `npm run db:seed`

> Preview deployments share the build command but **must not** migrate a shared production database. Keep migrations on `main` / manual deploy only.

## Security model (demo)

This is a **portfolio banking demo**, not a real bank.

| Control | What it does |
|---------|----------------|
| Ownership checks | Money actions require a session and account ownership |
| Password hashing | `bcrypt` for credentials |
| Cheque HMAC | Server-issued SVG bound to payee / amount / expiry |
| One-shot clear | Conditional `updateMany` so a cheque credits once |
| Concurrent balances | Conditional balance updates / claim helpers |
| Demo reset API | Bearer `CRON_SECRET` / `DEMO_RESET_SECRET` |
| HTTP headers | `nosniff`, `DENY` framing, HSTS, tight `Permissions-Policy` |

Not in scope: KYC, real payment rails, fraud ops, SOC2, rate-limit mesh, DB-enforced ledger immutability.

## Repository security (GitHub)

Local application controls are listed above. Repository governance lives in GitHub settings (branch ruleset, Actions permissions, secret scanning) — see `SECURITY.md` for vulnerability reporting.

Committed helpers:

| Path | Role |
|------|------|
| `.github/workflows/ci.yml` | Required PR checks (lint, typecheck, unit, Postgres integration, Playwright) |
| `.github/workflows/codeql.yml` | CodeQL analysis (JavaScript/TypeScript) |
| `.github/workflows/migrate-production.yml` | Prod migrations on `main` only (`environment: production`) |
| `.github/workflows/lighthouse.yml` | Public-route Lighthouse (not a merge blocker) |
| `.github/dependabot.yml` | Weekly npm + Actions updates |
| `.github/CODEOWNERS` | Ownership metadata (approval **not** required while solo) |
| `SECURITY.md` | How to report vulnerabilities privately |

## Known limitations

- **Shared demo reef** — visitors share `demo@` / `ami@`; reset (button / cron / seed) restores sample state
- **Ledger append-only by convention** — no PostgreSQL `REVOKE` / triggers; soft-hide exists for history UX
- **P2P expiry** — expired transfers are rejected on accept; there is no background refund job yet
- **Photo cheque upload** — unsigned photos skip instrument checks (demo convenience); signed SVG path is the serious path
- **Lighthouse** — public routes only (`/`, `/login`, `/signup`, `/docs`); authenticated `/app` is covered by Playwright smoke + signed-cheque E2E

## Quality gate (Lighthouse)

`.github/workflows/lighthouse.yml` audits public routes with [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci). Thresholds live in [`.lighthouserc.json`](./.lighthouserc.json).

## Project layout

```
prisma/           # schema, migrations, seed
e2e/              # Playwright: recruiter smoke + signed-cheque one-shot
scripts/          # migrate + ledger verify helpers
src/
  app/            # Next.js routes (incl. /docs)
  domain/         # pure business rules (+ ledger integrity)
  features/       # auth, accounts, transfers, p2p, deposits, bills, demo…
  lib/            # prisma, auth, shared utils
  test/           # Postgres integration helpers + suites
```

## Links

- Live demo: https://fish-fric-remastered-8ag2.vercel.app
- Remaster (this repo): https://github.com/RomainBoiret/FishFric-remastered
- Original team project: https://github.com/RomainBoiret/FishFric-Bank

## License

MIT — see [LICENSE](./LICENSE)
