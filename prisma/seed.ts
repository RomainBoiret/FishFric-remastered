/**
 * Seed démo recruteur.
 * Compte: demo@fishfric.app / Demo-FishFric-2026!
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ACCOUNT_RULES } from "../src/domain/money";
import { DEMO_CREDENTIALS } from "../src/features/auth/schemas";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_CREDENTIALS.password, 12);

  const demo = await prisma.user.upsert({
    where: { email: DEMO_CREDENTIALS.email },
    update: {
      passwordHash,
      firstName: "Aqua",
      lastName: "Recruteur",
      isDemo: true,
    },
    create: {
      email: DEMO_CREDENTIALS.email,
      passwordHash,
      firstName: "Aqua",
      lastName: "Recruteur",
      isDemo: true,
    },
  });

  await prisma.ledgerEntry.deleteMany({
    where: { account: { userId: demo.id } },
  });
  await prisma.p2PTransfer.deleteMany({
    where: {
      OR: [{ senderUserId: demo.id }, { recipientUserId: demo.id }],
    },
  });
  await prisma.notification.deleteMany({ where: { userId: demo.id } });
  await prisma.bankAccount.deleteMany({ where: { userId: demo.id } });

  const checking = await prisma.bankAccount.create({
    data: {
      userId: demo.id,
      type: "CHECKING",
      label: "Compte chèque",
      balanceCents: 245_000,
      interestBps: ACCOUNT_RULES.interestBps.CHECKING,
    },
  });

  const savings = await prisma.bankAccount.create({
    data: {
      userId: demo.id,
      type: "SAVINGS",
      label: "Épargne récifs",
      balanceCents: 812_000,
      interestBps: ACCOUNT_RULES.interestBps.SAVINGS,
    },
  });

  await prisma.bankAccount.create({
    data: {
      userId: demo.id,
      type: "CREDIT",
      label: "Carte requin",
      balanceCents: -34_000,
      creditLimitCents: ACCOUNT_RULES.defaultCreditLimitCents,
      interestBps: ACCOUNT_RULES.interestBps.CREDIT,
    },
  });

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);

  await prisma.ledgerEntry.createMany({
    data: [
      {
        accountId: checking.id,
        amountCents: 320_000,
        kind: "ADJUSTMENT",
        description: "Paie — Ocean Corp",
        createdAt: daysAgo(12),
      },
      {
        accountId: checking.id,
        amountCents: -80_000,
        kind: "TRANSFER_INTERNAL",
        description: "Vers Épargne récifs",
        transferGroupId: "seed-transfer-1",
        createdAt: daysAgo(10),
      },
      {
        accountId: savings.id,
        amountCents: 80_000,
        kind: "TRANSFER_INTERNAL",
        description: "Depuis Compte chèque",
        transferGroupId: "seed-transfer-1",
        createdAt: daysAgo(10),
      },
      {
        accountId: checking.id,
        amountCents: -12_500,
        kind: "BILL_PAYMENT",
        description: "Nautico Assurance",
        createdAt: daysAgo(6),
      },
      {
        accountId: savings.id,
        amountCents: 2_000,
        kind: "INTEREST",
        description: "Intérêts mensuels",
        createdAt: daysAgo(2),
      },
    ],
  });

  console.log("Seed OK");
  console.log(`  Démo: ${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
