import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { findBalanceMismatches } from "@/domain/ledger";
import { validateInternalTransfer } from "@/domain/transfers";
import {
  applyBalanceDelta,
  claimPendingDeposit,
  claimPendingP2P,
  ConcurrentModificationError,
} from "@/lib/account-balance";
import {
  createTestPrisma,
  createUser,
  getTestDatabaseUrl,
  resetDatabase,
} from "./helpers";

const hasDb = Boolean(getTestDatabaseUrl());

describe("integration: money paths", { skip: !hasDb }, () => {
  const prisma = createTestPrisma();

  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  it("records a balanced internal transfer on the ledger", async () => {
    const user = await createUser(prisma, { email: "xfer@test.local" });
    const from = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        type: "CHECKING",
        label: "Checking",
        balanceCents: 10_000,
      },
    });
    const to = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        type: "SAVINGS",
        label: "Savings",
        balanceCents: 0,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        accountId: from.id,
        amountCents: 10_000,
        kind: "ADJUSTMENT",
        description: "Opening",
      },
    });

    const amountCents = 2_500;
    const validation = validateInternalTransfer({
      from: {
        id: from.id,
        type: from.type,
        balanceCents: from.balanceCents,
        creditLimitCents: null,
        label: from.label,
      },
      to: {
        id: to.id,
        type: to.type,
        balanceCents: to.balanceCents,
        creditLimitCents: null,
        label: to.label,
      },
      amountCents,
    });
    assert.equal(validation.ok, true);

    const transferGroupId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.ledgerEntry.create({
        data: {
          accountId: from.id,
          amountCents: -amountCents,
          kind: "TRANSFER_INTERNAL",
          description: "To Savings",
          transferGroupId,
        },
      });
      await tx.ledgerEntry.create({
        data: {
          accountId: to.id,
          amountCents,
          kind: "TRANSFER_INTERNAL",
          description: "From Checking",
          transferGroupId,
        },
      });
      await applyBalanceDelta(tx, {
        accountId: from.id,
        expectedBalanceCents: from.balanceCents,
        deltaCents: -amountCents,
      });
      await applyBalanceDelta(tx, {
        accountId: to.id,
        expectedBalanceCents: to.balanceCents,
        deltaCents: amountCents,
      });
    });

    const entries = await prisma.ledgerEntry.findMany({
      where: { transferGroupId },
      orderBy: { amountCents: "asc" },
    });
    assert.equal(entries.length, 2);
    assert.equal(
      entries.reduce((sum, row) => sum + row.amountCents, 0),
      0,
    );

    const accounts = await prisma.bankAccount.findMany({
      where: { userId: user.id },
      include: { entries: { select: { amountCents: true } } },
    });
    assert.deepEqual(findBalanceMismatches(accounts), []);
    assert.equal(
      accounts.find((a) => a.id === from.id)?.balanceCents,
      7_500,
    );
    assert.equal(accounts.find((a) => a.id === to.id)?.balanceCents, 2_500);
  });

  it("rolls back ledger and balances when a transaction throws", async () => {
    const user = await createUser(prisma, { email: "rollback@test.local" });
    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        type: "CHECKING",
        balanceCents: 5_000,
      },
    });
    await prisma.ledgerEntry.create({
      data: {
        accountId: account.id,
        amountCents: 5_000,
        kind: "ADJUSTMENT",
        description: "Opening",
      },
    });

    await assert.rejects(
      prisma.$transaction(async (tx) => {
        await tx.ledgerEntry.create({
          data: {
            accountId: account.id,
            amountCents: -1_000,
            kind: "BILL_PAYMENT",
            description: "Should roll back",
          },
        });
        await applyBalanceDelta(tx, {
          accountId: account.id,
          expectedBalanceCents: 5_000,
          deltaCents: -1_000,
        });
        throw new Error("boom");
      }),
      /boom/,
    );

    const fresh = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: account.id },
      include: { entries: true },
    });
    assert.equal(fresh.balanceCents, 5_000);
    assert.equal(fresh.entries.length, 1);
    assert.equal(fresh.entries[0]?.kind, "ADJUSTMENT");
  });

  it("allows only one concurrent balance debit to win", async () => {
    const user = await createUser(prisma, { email: "race-bal@test.local" });
    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        type: "CHECKING",
        balanceCents: 100,
      },
    });

    const results = await Promise.allSettled([
      prisma.$transaction((tx) =>
        applyBalanceDelta(tx, {
          accountId: account.id,
          expectedBalanceCents: 100,
          deltaCents: -60,
        }),
      ),
      prisma.$transaction((tx) =>
        applyBalanceDelta(tx, {
          accountId: account.id,
          expectedBalanceCents: 100,
          deltaCents: -60,
        }),
      ),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok(
      rejected[0]?.status === "rejected" &&
        rejected[0].reason instanceof ConcurrentModificationError,
    );

    const fresh = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: account.id },
    });
    assert.equal(fresh.balanceCents, 40);
  });

  it("clears a cheque instrument only once under concurrency", async () => {
    const user = await createUser(prisma, { email: "cheque@test.local" });
    const cheque = await prisma.chequeInstrument.create({
      data: {
        id: "cintegrationcheque01",
        payeeUserId: user.id,
        amountCents: 1_200,
        payeeName: "Test",
        signature: "abc",
        status: "ISSUED",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const results = await Promise.allSettled([
      prisma.chequeInstrument.updateMany({
        where: { id: cheque.id, status: "ISSUED" },
        data: { status: "CLEARED", clearedAt: new Date() },
      }),
      prisma.chequeInstrument.updateMany({
        where: { id: cheque.id, status: "ISSUED" },
        data: { status: "CLEARED", clearedAt: new Date() },
      }),
    ]);

    const counts = results.map((r) =>
      r.status === "fulfilled" ? r.value.count : -1,
    );
    assert.equal(counts.filter((c) => c === 1).length, 1);
    assert.equal(counts.filter((c) => c === 0).length, 1);

    const fresh = await prisma.chequeInstrument.findUniqueOrThrow({
      where: { id: cheque.id },
    });
    assert.equal(fresh.status, "CLEARED");
  });

  it("credits a pending deposit only once under concurrency", async () => {
    const user = await createUser(prisma, { email: "deposit@test.local" });
    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        type: "CHECKING",
        balanceCents: 0,
      },
    });
    const deposit = await prisma.mobileDeposit.create({
      data: {
        userId: user.id,
        accountId: account.id,
        amountCents: 3_000,
        status: "PENDING",
        imageLabel: "fishfric-cheque-30.00.svg",
      },
    });

    const results = await Promise.allSettled([
      prisma.$transaction((tx) =>
        claimPendingDeposit(tx, { depositId: deposit.id, userId: user.id }),
      ),
      prisma.$transaction((tx) =>
        claimPendingDeposit(tx, { depositId: deposit.id, userId: user.id }),
      ),
    ]);

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(results.filter((r) => r.status === "rejected").length, 1);

    const fresh = await prisma.mobileDeposit.findUniqueOrThrow({
      where: { id: deposit.id },
    });
    assert.equal(fresh.status, "CREDITED");
  });

  it("refunds a rejected P2P on the ledger and claims status once", async () => {
    const sender = await createUser(prisma, { email: "sender@test.local" });
    const recipient = await createUser(prisma, {
      email: "recipient@test.local",
    });
    const source = await prisma.bankAccount.create({
      data: {
        userId: sender.id,
        type: "CHECKING",
        balanceCents: 8_000,
      },
    });
    await prisma.ledgerEntry.create({
      data: {
        accountId: source.id,
        amountCents: 10_000,
        kind: "ADJUSTMENT",
        description: "Opening",
      },
    });
    await prisma.ledgerEntry.create({
      data: {
        accountId: source.id,
        amountCents: -2_000,
        kind: "TRANSFER_P2P",
        description: "P2P hold",
      },
    });

    const p2p = await prisma.p2PTransfer.create({
      data: {
        senderUserId: sender.id,
        recipientEmail: recipient.email,
        recipientUserId: recipient.id,
        sourceAccountId: source.id,
        amountCents: 2_000,
        question: "color?",
        answerHash: "hash",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await prisma.$transaction(async (tx) => {
      await claimPendingP2P(tx, {
        p2pId: p2p.id,
        nextStatus: "REJECTED",
        recipientUserId: recipient.id,
      });
      await tx.ledgerEntry.create({
        data: {
          accountId: source.id,
          amountCents: 2_000,
          kind: "TRANSFER_P2P",
          description: "P2P refund",
          p2pTransferId: p2p.id,
        },
      });
      await applyBalanceDelta(tx, {
        accountId: source.id,
        expectedBalanceCents: 8_000,
        deltaCents: 2_000,
      });
    });

    const second = await prisma.$transaction(async (tx) => {
      try {
        await claimPendingP2P(tx, {
          p2pId: p2p.id,
          nextStatus: "REJECTED",
          recipientUserId: recipient.id,
        });
        return "claimed";
      } catch (error) {
        if (error instanceof ConcurrentModificationError) return "blocked";
        throw error;
      }
    });
    assert.equal(second, "blocked");

    const fresh = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: source.id },
      include: { entries: { select: { amountCents: true } } },
    });
    assert.equal(fresh.balanceCents, 10_000);
    assert.deepEqual(findBalanceMismatches([fresh]), []);
    assert.equal(
      (await prisma.p2PTransfer.findUniqueOrThrow({ where: { id: p2p.id } }))
        .status,
      "REJECTED",
    );
  });
});
