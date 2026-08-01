import { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Thrown when a conditional balance update matches zero rows (TOCTOU). */
export class ConcurrentModificationError extends Error {
  constructor(message = "Something changed concurrently. Please try again.") {
    super(message);
    this.name = "ConcurrentModificationError";
  }
}

/**
 * Atomically apply a balance delta only if the cached balance is still
 * `expectedBalanceCents`. Prevents lost updates under concurrent writes.
 */
export async function applyBalanceDelta(
  tx: Tx,
  input: {
    accountId: string;
    expectedBalanceCents: number;
    deltaCents: number;
  },
): Promise<void> {
  const next = input.expectedBalanceCents + input.deltaCents;
  const result = await tx.bankAccount.updateMany({
    where: {
      id: input.accountId,
      status: "ACTIVE",
      balanceCents: input.expectedBalanceCents,
    },
    data: { balanceCents: next },
  });

  if (result.count !== 1) {
    throw new ConcurrentModificationError(
      "Account balance changed. Please try again.",
    );
  }
}

/** Claim a pending mobile deposit for credit (one winner under concurrency). */
export async function claimPendingDeposit(
  tx: Tx,
  input: { depositId: string; userId: string },
): Promise<void> {
  const result = await tx.mobileDeposit.updateMany({
    where: {
      id: input.depositId,
      userId: input.userId,
      status: "PENDING",
    },
    data: {
      status: "CREDITED",
      resolvedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new ConcurrentModificationError(
      "This deposit was already processed.",
    );
  }
}

/** Claim a pending P2P transfer for accept/reject (one winner). */
export async function claimPendingP2P(
  tx: Tx,
  input: {
    p2pId: string;
    nextStatus: "ACCEPTED" | "REJECTED";
    recipientUserId: string;
  },
): Promise<void> {
  const result = await tx.p2PTransfer.updateMany({
    where: {
      id: input.p2pId,
      status: "PENDING",
    },
    data: {
      status: input.nextStatus,
      resolvedAt: new Date(),
      recipientUserId: input.recipientUserId,
    },
  });

  if (result.count !== 1) {
    throw new ConcurrentModificationError(
      "Transfer not found or already processed.",
    );
  }
}
