/**
 * Runs `prisma migrate deploy` without advisory locks.
 * Neon (esp. cold start / CI) often hits P1002 waiting on pg_advisory_lock.
 */
import { spawnSync } from "node:child_process";

process.env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "1";

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
