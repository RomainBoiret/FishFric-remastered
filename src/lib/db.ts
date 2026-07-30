import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { withPgSslCompat } from "@/lib/pg-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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

function hasMobileDeposit(client: PrismaClient): boolean {
  return typeof (client as { mobileDeposit?: unknown }).mobileDeposit !== "undefined";
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  // After `prisma generate`, Turbopack / HMR can keep a stale global client
  // that predates new models (e.g. mobileDeposit).
  if (cached && hasMobileDeposit(cached)) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
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
