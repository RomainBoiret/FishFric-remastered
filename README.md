# Fish&Fric (remastered)

Remaster full-stack de la banque en ligne thématique **Fish&Fric** (projet intégrateur ÉTS 2024), publié comme démo portfolio.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **PostgreSQL** (Neon) + **Prisma**
- **Auth.js** (credentials + JWT)
- Domaine métier (`src/domain`) + **ledger** immuable

## Fonctionnalités

- Comptes : chèque, épargne, Carte requin
- Transferts internes (double écriture ledger)
- P2P avec question / réponse
- Mode démo recruteur (`demo@fishfric.app`)

## Démarrage local

```bash
cp .env.example .env
# DATABASE_URL + AUTH_SECRET

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Compte démo : `demo@fishfric.app` / `Demo-FishFric-2026!`  
Compte ami (P2P) : `ami@fishfric.app` / même mot de passe

## Déploiement (Vercel)

1. Importer le repo sur [vercel.com](https://vercel.com)
2. Variables d'environnement :
   - `DATABASE_URL` — connection string Neon (idéalement pooled)
   - `AUTH_SECRET` — même valeur que en local (ou nouvelle générée)
3. Deploy — le script `build` lance `prisma migrate deploy` puis `next build`
4. Après le 1er deploy : en local (ou CI), `npm run db:seed` une fois contre la DB de prod si tu veux la démo préremplie

## Structure

```
prisma/           # schema, migrations, seed
src/
  app/            # routes Next.js
  domain/         # règles métier pures
  features/       # auth, accounts, transfers, p2p
  lib/            # prisma, auth, utils
```

## Licence

MIT
