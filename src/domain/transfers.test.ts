import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseAmountToCents,
  validateInternalTransfer,
  type TransferAccount,
} from "./transfers";

const checking = (over: Partial<TransferAccount> = {}): TransferAccount => ({
  id: "from",
  type: "CHECKING",
  balanceCents: 10_000,
  creditLimitCents: null,
  label: "Checking",
  ...over,
});

describe("parseAmountToCents", () => {
  it("parses whole and fractional CAD amounts", () => {
    assert.equal(parseAmountToCents("12"), 1200);
    assert.equal(parseAmountToCents("12.5"), 1250);
    assert.equal(parseAmountToCents("12.50"), 1250);
    assert.equal(parseAmountToCents("1,25"), 125);
  });

  it("rejects invalid shapes", () => {
    assert.equal(parseAmountToCents(""), null);
    assert.equal(parseAmountToCents("12.345"), null);
    assert.equal(parseAmountToCents("abc"), null);
    assert.equal(parseAmountToCents("0"), null);
    assert.equal(parseAmountToCents("-3"), null);
  });
});

describe("validateInternalTransfer", () => {
  it("accepts a checking → savings transfer", () => {
    const result = validateInternalTransfer({
      from: checking(),
      to: checking({ id: "to", type: "SAVINGS" }),
      amountCents: 500,
    });
    assert.equal(result.ok, true);
  });

  it("rejects same-account transfers", () => {
    const from = checking();
    const result = validateInternalTransfer({
      from,
      to: from,
      amountCents: 100,
    });
    assert.equal(result.ok, false);
  });

  it("rejects non-positive amounts", () => {
    const result = validateInternalTransfer({
      from: checking(),
      to: checking({ id: "to" }),
      amountCents: 0,
    });
    assert.equal(result.ok, false);
  });

  it("rejects transfers from the Shark Card", () => {
    const result = validateInternalTransfer({
      from: checking({ type: "CREDIT", balanceCents: -1000 }),
      to: checking({ id: "to" }),
      amountCents: 100,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /shark card/i);
  });

  it("rejects insufficient source funds", () => {
    const result = validateInternalTransfer({
      from: checking({ balanceCents: 50 }),
      to: checking({ id: "to" }),
      amountCents: 100,
    });
    assert.equal(result.ok, false);
  });

  it("rejects overpaying a credit card balance", () => {
    const result = validateInternalTransfer({
      from: checking(),
      to: checking({
        id: "card",
        type: "CREDIT",
        balanceCents: -200,
        creditLimitCents: -500_000,
      }),
      amountCents: 500,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /exceeds the amount owed/i);
  });

  it("rejects payments that would leave the card past its limit", () => {
    const result = validateInternalTransfer({
      from: checking({ balanceCents: 100_000 }),
      to: checking({
        id: "card",
        type: "CREDIT",
        balanceCents: -600_000,
        creditLimitCents: -500_000,
      }),
      amountCents: 10,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /credit limit/i);
  });

  it("allows paying a card exactly to zero with a null limit", () => {
    const result = validateInternalTransfer({
      from: checking(),
      to: checking({
        id: "card",
        type: "CREDIT",
        balanceCents: -50,
        creditLimitCents: null,
      }),
      amountCents: 50,
    });
    assert.equal(result.ok, true);
  });
});
