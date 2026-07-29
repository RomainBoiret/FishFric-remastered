import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findBalanceMismatches,
  isBalanceConsistent,
  sumLedgerCents,
} from "./ledger";

describe("ledger integrity", () => {
  it("sums signed ledger amounts", () => {
    assert.equal(
      sumLedgerCents([
        { amountCents: 10_000 },
        { amountCents: -2_500 },
        { amountCents: 500 },
      ]),
      8_000,
    );
  });

  it("treats an empty ledger as zero", () => {
    assert.equal(sumLedgerCents([]), 0);
    assert.equal(isBalanceConsistent(0, []), true);
  });

  it("proves balanceCents matches the ledger sum", () => {
    const entries = [
      { amountCents: 245_000 },
      { amountCents: -40_000 },
      { amountCents: 1_250 },
    ];
    assert.equal(isBalanceConsistent(206_250, entries), true);
    assert.equal(isBalanceConsistent(200_000, entries), false);
  });

  it("lists accounts whose cached balance drifted from the ledger", () => {
    const mismatches = findBalanceMismatches([
      {
        id: "ok",
        balanceCents: 100,
        entries: [{ amountCents: 150 }, { amountCents: -50 }],
      },
      {
        id: "drift",
        balanceCents: 999,
        entries: [{ amountCents: 100 }],
      },
    ]);

    assert.deepEqual(mismatches, [
      {
        accountId: "drift",
        balanceCents: 999,
        ledgerSumCents: 100,
        deltaCents: 899,
      },
    ]);
  });
});
