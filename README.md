# Fish&Fric (remastered)

Full-stack remaster of **Fish&Fric**, an ocean-themed online banking demo originally built as an ÉTS integrator project (2024). Rebuilt as a public portfolio app recruiters can explore live.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** (Neon) + **Prisma**
- **Auth.js** (credentials + JWT sessions)
- Lightweight domain layer (`src/domain`) with an **immutable ledger**

## Features

- Bank products: checking, savings, and “Carte requin” (credit)
- Internal transfers (double-entry ledger writes)
- P2P transfers with a security question / answer
- Recruiter demo mode (`demo@fishfric.app`)

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

| Account | Email | Password |
|---------|-------|----------|
| Demo | `demo@fishfric.app` | `Demo-FishFric-2026!` |
| Friend (P2P) | `ami@fishfric.app` | same password |

## Deploy (Vercel)

1. Import this repo on [vercel.com](https://vercel.com)
2. Set environment variables:
   - `DATABASE_URL` - Neon **pooled** URL (host includes `-pooler`)
   - `DIRECT_URL` - Neon **direct** URL (same credentials, host **without** `-pooler`) - required for migrations
   - `AUTH_SECRET` - Auth.js secret
3. Deploy - the build runs migrations (advisory lock disabled for Neon) then `next build`
4. Seed production once: `npm run db:seed` (with `DATABASE_URL` pointing at Neon)

> If the build fails with `P1002`, check that `DIRECT_URL` has no `-pooler` host. `scripts/migrate-deploy.mjs` already disables Prisma advisory locking.

## Quality gate (Lighthouse)

`.github/workflows/lighthouse.yml` audits the public routes (`/`, `/login`, `/signup`) with [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci):

- On PRs it waits for the Vercel preview and audits that URL, otherwise (push to `main`, weekly cron, manual run) it audits production.
- Thresholds are in [`.lighthouserc.json`](./.lighthouserc.json): a11y, best practices and SEO fail under 90, performance only warns under 80.
- Reports go to Lighthouse temporary public storage, with a summary on the run.

## Project layout

```
prisma/           # schema, migrations, seed
scripts/          # migrate helpers for CI/Vercel
src/
  app/            # Next.js routes
  domain/         # pure business rules
  features/       # auth, accounts, transfers, p2p
  lib/            # prisma, auth, shared utils
```

## License

MIT
