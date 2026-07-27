import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Migrations need a direct (non-pooler) Postgres URL.
 * Neon pooled hosts (*-pooler.*) time out on pg_advisory_lock.
 */
const migrateUrl =
  process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrateUrl,
  },
});
