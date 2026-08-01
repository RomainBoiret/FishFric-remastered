import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { withPgSslCompat } from "@/lib/pg-url";

/**
 * Bump when the Prisma schema gains models or fields so HMR drops a stale
 * global client. After bumping, restart `next dev` if validation errors persist.
 */
const PRISMA_SCHEMA_REV = 2;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRev: number | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({
    connectionString: withPgSslCompat(connectionString),
  });
  return new PrismaClient({ adapter });
}

function clientHasModel(
  client: PrismaClient,
  model: "mobileDeposit" | "chequeInstrument",
): boolean {
  return (
    typeof (client as unknown as Record<string, unknown>)[model] !== "undefined"
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  // After `prisma generate`, Turbopack / HMR can keep a stale global client
  // that predates new models or fields (e.g. hiddenAt on LedgerEntry).
  if (
    cached &&
    globalForPrisma.prismaRev === PRISMA_SCHEMA_REV &&
    clientHasModel(cached, "mobileDeposit") &&
    clientHasModel(cached, "chequeInstrument")
  ) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  // Always cache: without this, `next start` opens a new pg pool per
  // Proxy access and exhausts Postgres (seen under Playwright).
  globalForPrisma.prisma = client;
  globalForPrisma.prismaRev = PRISMA_SCHEMA_REV;
  return client;
}

/**
 * Proxy so callers always hit a client that matches the generated schema,
 * even if this module was evaluated before a regenerate.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
