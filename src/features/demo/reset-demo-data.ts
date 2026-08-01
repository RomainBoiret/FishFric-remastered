/**
 * Shared demo reef reset — used by `npm run db:seed`, the cron API, and the
 * in-app reset button for `isDemo` users.
 *
 * Invariant: BankAccount.balanceCents === Σ LedgerEntry.amountCents
 */
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { ACCOUNT_RULES } from "@/domain/money";
import { p2pExpiresAt } from "@/domain/p2p";
import { DEMO_CREDENTIALS } from "@/features/auth/schemas";
import { FRIEND_CREDENTIALS } from "@/features/p2p/schemas";

export type DemoResetResult = {
  balances: {
    checking: number;
    savings: number;
    credit: number;
    friend: number;
  };
};

async function upsertDemoUser(
  prisma: PrismaClient,
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

async function wipeUserBanking(prisma: PrismaClient, userId: string) {
  await prisma.ledgerEntry.deleteMany({
    where: { account: { userId } },
  });
  await prisma.mobileDeposit.deleteMany({ where: { userId } });
  await prisma.chequeInstrument.deleteMany({ where: { payeeUserId: userId } });
  await prisma.p2PTransfer.deleteMany({
    where: {
      OR: [{ senderUserId: userId }, { recipientUserId: userId }],
    },
  });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.bankAccount.deleteMany({ where: { userId } });
}

async function syncBalanceFromLedger(prisma: PrismaClient, accountId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { accountId },
    select: { amountCents: true },
  });
  const balanceCents = entries.reduce((sum, row) => sum + row.amountCents, 0);
  await prisma.bankAccount.update({
    where: { id: accountId },
    data: { balanceCents },
  });
  return balanceCents;
}

/** Wipe and rebuild the shared recruiter demo + friend accounts. */
export async function resetDemoData(
  prisma: PrismaClient,
): Promise<DemoResetResult> {
  const demo = await upsertDemoUser(
    prisma,
    DEMO_CREDENTIALS.email,
    DEMO_CREDENTIALS.password,
    "Aqua",
    "Recruiter",
    true,
  );
  const friend = await upsertDemoUser(
    prisma,
    FRIEND_CREDENTIALS.email,
    FRIEND_CREDENTIALS.password,
    "Nemo",
    "Friend",
    true,
  );

  await wipeUserBanking(prisma, demo.id);
  await wipeUserBanking(prisma, friend.id);

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
      label: "Checking account",
      balanceCents: 0,
      interestBps: ACCOUNT_RULES.interestBps.CHECKING,
    },
  });

  const savings = await prisma.bankAccount.create({
    data: {
      userId: demo.id,
      type: "SAVINGS",
      label: "Reef savings",
      balanceCents: 0,
      interestBps: ACCOUNT_RULES.interestBps.SAVINGS,
    },
  });

  const credit = await prisma.bankAccount.create({
    data: {
      userId: demo.id,
      type: "CREDIT",
      label: "Shark Card",
      balanceCents: 0,
      creditLimitCents: ACCOUNT_RULES.defaultCreditLimitCents,
      interestBps: ACCOUNT_RULES.interestBps.CREDIT,
    },
  });

  const friendChecking = await prisma.bankAccount.create({
    data: {
      userId: friend.id,
      type: "CHECKING",
      label: "Checking account",
      balanceCents: 0,
      interestBps: ACCOUNT_RULES.interestBps.CHECKING,
    },
  });

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);

  await prisma.ledgerEntry.createMany({
    data: [
      {
        accountId: checking.id,
        amountCents: 337_500,
        kind: "ADJUSTMENT",
        description: "Opening deposit - Ocean Corp",
        createdAt: daysAgo(20),
      },
      {
        accountId: savings.id,
        amountCents: 730_000,
        kind: "ADJUSTMENT",
        description: "Opening transfer into Reef savings",
        createdAt: daysAgo(20),
      },
      {
        accountId: credit.id,
        amountCents: -34_000,
        kind: "ADJUSTMENT",
        description: "Shark Card purchase - dive gear",
        createdAt: daysAgo(15),
      },
      {
        accountId: friendChecking.id,
        amountCents: 150_000,
        kind: "ADJUSTMENT",
        description: "Opening deposit",
        createdAt: daysAgo(18),
      },
      {
        accountId: checking.id,
        amountCents: -80_000,
        kind: "TRANSFER_INTERNAL",
        description: "To Reef savings",
        transferGroupId: "seed-transfer-1",
        createdAt: daysAgo(10),
      },
      {
        accountId: savings.id,
        amountCents: 80_000,
        kind: "TRANSFER_INTERNAL",
        description: "From Checking account",
        transferGroupId: "seed-transfer-1",
        createdAt: daysAgo(10),
      },
      {
        accountId: checking.id,
        amountCents: -12_500,
        kind: "BILL_PAYMENT",
        description: "Nautico Insurance",
        createdAt: daysAgo(6),
      },
      {
        accountId: savings.id,
        amountCents: 2_000,
        kind: "INTEREST",
        description: "Monthly interest",
        createdAt: daysAgo(2),
      },
    ],
  });

  const pendingAmount = 40_00;
  const answerHash = await bcrypt.hash("shark", 12);

  const pending = await prisma.p2PTransfer.create({
    data: {
      senderUserId: friend.id,
      recipientEmail: DEMO_CREDENTIALS.email,
      recipientUserId: demo.id,
      sourceAccountId: friendChecking.id,
      amountCents: pendingAmount,
      question: "Favorite sea animal?",
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
      description: `P2P to ${DEMO_CREDENTIALS.email} (pending)`,
      p2pTransferId: pending.id,
    },
  });

  const [checkingBal, savingsBal, creditBal, friendBal] = await Promise.all([
    syncBalanceFromLedger(prisma, checking.id),
    syncBalanceFromLedger(prisma, savings.id),
    syncBalanceFromLedger(prisma, credit.id),
    syncBalanceFromLedger(prisma, friendChecking.id),
  ]);

  await prisma.notification.create({
    data: {
      userId: demo.id,
      title: "P2P transfer received",
      body: `Nemo Friend sent you $${(pendingAmount / 100).toFixed(2)}.`,
      p2pTransferId: pending.id,
    },
  });

  return {
    balances: {
      checking: checkingBal,
      savings: savingsBal,
      credit: creditBal,
      friend: friendBal,
    },
  };
}
