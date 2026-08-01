/**
 * Runs `prisma migrate deploy` against DIRECT_URL (fallback: DATABASE_URL).
 *
 * Not part of `npm run build` — call this explicitly for production schema
 * updates (GitHub Action, Vercel Production build override, or local CLI).
 *
 * Advisory locks are disabled: Neon (esp. cold start / pooled hosts) often
 * hits P1002 waiting on pg_advisory_lock. Prefer DIRECT_URL without `-pooler`.
 */
import { spawnSync } from "node:child_process";

process.env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "1";

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
