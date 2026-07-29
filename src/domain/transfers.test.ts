import { describe, expect, it } from "vitest";
import {
  parseAmountToCents,
  validateInternalTransfer,
  type TransferAccount,
} from "@/domain/transfers";

describe("parseAmountToCents", () => {
  it("parses a whole number", () => {
    expect(parseAmountToCents("10")).toBe(1000);
  });

  it("parses one or two decimal digits", () => {
    expect(parseAmountToCents("10.5")).toBe(1050);
    expect(parseAmountToCents("10.50")).toBe(1050);
  });

  it("accepts a comma as the decimal separator", () => {
    expect(parseAmountToCents("10,50")).toBe(1050);
  });

  it("strips surrounding and internal whitespace", () => {
    expect(parseAmountToCents(" 10.50 ")).toBe(1050);
    expect(parseAmountToCents("1 000.50")).toBe(100050);
  });

  it("rejects non-numeric input", () => {
    expect(parseAmountToCents("abc")).toBeNull();
  });

  it("rejects more than two decimal digits", () => {
    expect(parseAmountToCents("10.555")).toBeNull();
  });

  it("rejects zero and negative amounts", () => {
    expect(parseAmountToCents("0")).toBeNull();
    expect(parseAmountToCents("-5")).toBeNull();
  });

  it("rejects a trailing decimal point with no digits", () => {
    expect(parseAmountToCents("10.")).toBeNull();
  });

  it("only strips the first comma, so thousand-comma input is rejected", () => {
    expect(parseAmountToCents("1,234.56")).toBeNull();
  });
});

function account(overrides: Partial<TransferAccount>): TransferAccount {
  return {
    id: "acc-1",
    type: "CHECKING",
    balanceCents: 10_000,
    creditLimitCents: null,
    label: null,
    ...overrides,
  };
}

describe("validateInternalTransfer", () => {
  it("accepts a valid transfer between two checking-like accounts", () => {
    const from = account({ id: "from" });
    const to = account({ id: "to", type: "SAVINGS" });
    expect(
      validateInternalTransfer({ from, to, amountCents: 1_000 }),
    ).toEqual({ ok: true });
  });

  it("rejects transferring to the same account", () => {
    const acc = account({ id: "same" });
    const result = validateInternalTransfer({
      from: acc,
      to: acc,
      amountCents: 1_000,
    });
    expect(result).toEqual({
      ok: false,
      reason: "Choose two different accounts.",
    });
  });

  it("rejects a non-positive amount", () => {
    const result = validateInternalTransfer({
      from: account({ id: "from" }),
      to: account({ id: "to" }),
      amountCents: 0,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects transfers from a credit account", () => {
    const from = account({ id: "from", type: "CREDIT", balanceCents: 0 });
    const to = account({ id: "to" });
    const result = validateInternalTransfer({ from, to, amountCents: 1_000 });
    expect(result).toEqual({
      ok: false,
      reason: "Cannot transfer from the Shark Card.",
    });
  });

  it("rejects when the source account has insufficient funds", () => {
    const from = account({ id: "from", balanceCents: 500 });
    const to = account({ id: "to" });
    const result = validateInternalTransfer({ from, to, amountCents: 1_000 });
    expect(result).toEqual({
      ok: false,
      reason: "Insufficient funds on the source account.",
    });
  });

  it("rejects a credit payment that overpays the balance owed", () => {
    const from = account({ id: "from", balanceCents: 10_000 });
    const to = account({
      id: "to",
      type: "CREDIT",
      balanceCents: -500, // owes $5.00
      creditLimitCents: -500_000,
    });
    const result = validateInternalTransfer({ from, to, amountCents: 1_000 });
    expect(result).toEqual({
      ok: false,
      reason: "This payment exceeds the amount owed on the card.",
    });
  });

  it("accepts a credit payment that exactly settles the balance owed", () => {
    const from = account({ id: "from", balanceCents: 10_000 });
    const to = account({
      id: "to",
      type: "CREDIT",
      balanceCents: -500,
      creditLimitCents: -500_000,
    });
    expect(
      validateInternalTransfer({ from, to, amountCents: 500 }),
    ).toEqual({ ok: true });
  });

  it("rejects a partial payment that leaves the balance past the credit limit", () => {
    // Balance already exceeds the (possibly lowered) limit; a small payment
    // reduces the debt but not enough to bring it back within the limit.
    const from = account({ id: "from", balanceCents: 10_000 });
    const to = account({
      id: "to",
      type: "CREDIT",
      balanceCents: -600,
      creditLimitCents: -500,
    });
    const result = validateInternalTransfer({ from, to, amountCents: 50 });
    expect(result).toEqual({ ok: false, reason: "Credit limit exceeded." });
  });
});
