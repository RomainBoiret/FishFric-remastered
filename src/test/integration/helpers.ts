import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { withPgSslCompat } from "@/lib/pg-url";

/** Prefer an explicit test URL so local `npm test` never hits Neon by accident. */
export function getTestDatabaseUrl(): string | null {
  const url = process.env.TEST_DATABASE_URL?.trim();
  return url || null;
}

export function createTestPrisma(): PrismaClient {
  const url = getTestDatabaseUrl();
  if (!url) {
    throw new Error("TEST_DATABASE_URL is required for integration tests");
  }
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: withPgSslCompat(url),
    }),
  });
}

/** Wipe all app tables between cases (FK-safe). */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "LedgerEntry",
      "MobileDeposit",
      "Notification",
      "P2PTransfer",
      "ChequeInstrument",
      "BankAccount",
      "User"
    RESTART IDENTITY CASCADE
  `);
}

export async function createUser(
  prisma: PrismaClient,
  input: {
    email: string;
    firstName?: string;
    lastName?: string;
    isDemo?: boolean;
  },
) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: "test-hash-not-used",
      firstName: input.firstName ?? "Test",
      lastName: input.lastName ?? "User",
      isDemo: input.isDemo ?? false,
    },
  });
}
