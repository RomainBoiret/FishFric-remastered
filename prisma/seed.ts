/**
 * Seed démo recruteur.
 * Démo: demo@fishfric.app / Demo-FishFric-2026!
 * Ami:  ami@fishfric.app / Demo-FishFric-2026!
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ACCOUNT_RULES } from "../src/domain/money";
import { p2pExpiresAt } from "../src/domain/p2p";
import { DEMO_CREDENTIALS } from "../src/features/auth/schemas";
import { FRIEND_CREDENTIALS } from "../src/features/p2p/schemas";
import { withPgSslCompat } from "../src/lib/pg-url";

const adapter = new PrismaPg({
  connectionString: withPgSslCompat(process.env.DATABASE_URL!),
});
const prisma = new PrismaClient({ adapter });

async function upsertDemoUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  isDemo: boolean,
) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, firstName, lastName, isDemo },
    create: { email, passwordHash, firstName, lastName, isDemo },
  });
}

async function wipeUserBanking(userId: string) {
  await prisma.ledgerEntry.deleteMany({
    where: { account: { userId } },
  });
  await prisma.p2PTransfer.deleteMany({
    where: {
      OR: [{ senderUserId: userId }, { recipientUserId: userId }],
    },
  });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.bankAccount.deleteMany({ where: { userId } });
}

async function main() {
  const demo = await upsertDemoUser(
    DEMO_CREDENTIALS.email,
    DEMO_CREDENTIALS.password,
    "Aqua",
    "Recruteur",
    true,
  );
  const friend = await upsertDemoUser(
    FRIEND_CREDENTIALS.email,
    FRIEND_CREDENTIALS.password,
    "Nemo",
    "Ami",
    true,
  );

  await wipeUserBanking(demo.id);
  await wipeUserBanking(friend.id);

  // Also clear P2P by email match leftover
  await prisma.p2PTransfer.deleteMany({
    where: {
      OR: [
        { recipientEmail: DEMO_CREDENTIALS.email },
        { recipientEmail: FRIEND_CREDENTIALS.email },
      ],
    },
  });

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

  const friendChecking = await prisma.bankAccount.create({
    data: {
      userId: friend.id,
      type: "CHECKING",
      label: "Compte chèque",
      balanceCents: 150_000,
      interestBps: ACCOUNT_RULES.interestBps.CHECKING,
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

  const pendingAmount = 40_00;
  const answerHash = await bcrypt.hash("requin", 12);

  const pending = await prisma.p2PTransfer.create({
    data: {
      senderUserId: friend.id,
      recipientEmail: DEMO_CREDENTIALS.email,
      recipientUserId: demo.id,
      sourceAccountId: friendChecking.id,
      amountCents: pendingAmount,
      question: "Animal marin préféré ?",
      answerHash,
      status: "PENDING",
      expiresAt: p2pExpiresAt(),
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      accountId: friendChecking.id,
      amountCents: -pendingAmount,
      kind: "TRANSFER_P2P",
      description: `P2P vers ${DEMO_CREDENTIALS.email} (en attente)`,
      p2pTransferId: pending.id,
    },
  });

  await prisma.bankAccount.update({
    where: { id: friendChecking.id },
    data: { balanceCents: 150_000 - pendingAmount },
  });

  await prisma.notification.create({
    data: {
      userId: demo.id,
      title: "Transfert P2P reçu",
      body: `Nemo Ami t'envoie ${(pendingAmount / 100).toFixed(2)} $.`,
      p2pTransferId: pending.id,
    },
  });

  console.log("Seed OK");
  console.log(`  Démo: ${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}`);
  console.log(`  Ami:  ${FRIEND_CREDENTIALS.email} / ${FRIEND_CREDENTIALS.password}`);
  console.log(`  P2P pending → démo, réponse: requin`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
