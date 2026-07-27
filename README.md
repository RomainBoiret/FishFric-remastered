# Fish&Fric

Remaster full-stack de la banque en ligne thématique **Fish&Fric** (projet intégrateur ÉTS 2024), pensé comme démo portfolio publique.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **PostgreSQL** + **Prisma**
- Domaine métier léger (`src/domain`) + ledger immuable

## Fonctionnalités prévues

- Comptes : chèque, épargne, Carte requin
- Transferts internes + P2P (question / réponse)
- Notifications, support, mode démo recruteur
- Landing brandée océan

## Démarrage

```bash
cp .env.example .env
# Renseigner DATABASE_URL (Neon / Supabase / Postgres local)

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Structure

```
prisma/           # schema + seed
src/
  app/            # routes Next.js
  domain/         # règles métier pures
  lib/            # prisma, auth, utils
  features/       # (à venir) modules UI + actions
```

## Licence

MIT — publication gratuite prévue pour consultation recruteurs.
