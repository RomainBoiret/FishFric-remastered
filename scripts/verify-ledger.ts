/**
 * Reconcile BankAccount.balanceCents against Σ LedgerEntry.amountCents.
 *
 * Usage: npm run db:verify-ledger
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { findBalanceMismatches } from "../src/domain/ledger";
import { withPgSslCompat } from "../src/lib/pg-url";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: withPgSslCompat(connectionString),
    }),
  });

  try {
    const accounts = await prisma.bankAccount.findMany({
      select: {
        id: true,
        type: true,
        label: true,
        balanceCents: true,
        user: { select: { email: true } },
        entries: { select: { amountCents: true } },
      },
    });

    const mismatches = findBalanceMismatches(accounts);

    if (mismatches.length === 0) {
      console.log(
        `Ledger OK: ${accounts.length} account(s) - balanceCents matches Σ LedgerEntry.`,
      );
      return;
    }

    console.error(
      `Ledger integrity failed: ${mismatches.length} account(s) drifted.`,
    );
    for (const mismatch of mismatches) {
      const account = accounts.find((a) => a.id === mismatch.accountId);
      console.error(
        `- ${account?.user.email ?? "?"} / ${account?.type ?? "?"} (${mismatch.accountId})`,
      );
      console.error(
        `  cached=${mismatch.balanceCents} ledger=${mismatch.ledgerSumCents} delta=${mismatch.deltaCents}`,
      );
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
