import { describe, expect, it } from "vitest";
import {
  assertSufficientFunds,
  canOpenAccount,
  type AccountType,
} from "@/domain/accounts";
import { ACCOUNT_RULES } from "@/domain/money";

describe("canOpenAccount", () => {
  it("allows opening a checking account when none exists", () => {
    expect(
      canOpenAccount({ type: "CHECKING", existingTypes: [], savingsCount: 0 }),
    ).toEqual({ ok: true });
  });

  it("rejects a second checking account", () => {
    const result = canOpenAccount({
      type: "CHECKING",
      existingTypes: ["CHECKING"],
      savingsCount: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/checking account already exists/i);
  });

  it("allows a savings account below the max", () => {
    expect(
      canOpenAccount({
        type: "SAVINGS",
        existingTypes: ["CHECKING"],
        savingsCount: ACCOUNT_RULES.maxSavingsAccounts - 1,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects a savings account at the max", () => {
    const result = canOpenAccount({
      type: "SAVINGS",
      existingTypes: ["CHECKING"],
      savingsCount: ACCOUNT_RULES.maxSavingsAccounts,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain(String(ACCOUNT_RULES.maxSavingsAccounts));
  });

  it("allows opening a credit account when none exists", () => {
    expect(
      canOpenAccount({ type: "CREDIT", existingTypes: [], savingsCount: 0 }),
    ).toEqual({ ok: true });
  });

  it("rejects a second credit account", () => {
    const result = canOpenAccount({
      type: "CREDIT",
      existingTypes: ["CREDIT"],
      savingsCount: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/shark card already exists/i);
  });

  it("rejects an unknown account type", () => {
    const result = canOpenAccount({
      type: "BOGUS" as AccountType,
      existingTypes: [],
      savingsCount: 0,
    });
    expect(result).toEqual({ ok: false, reason: "Invalid account type." });
  });
});

describe("assertSufficientFunds", () => {
  it("does not throw when the balance covers the amount", () => {
    expect(() => assertSufficientFunds(1000, 500)).not.toThrow();
  });

  it("does not throw when the balance exactly matches the amount", () => {
    expect(() => assertSufficientFunds(500, 500)).not.toThrow();
  });

  it("throws for a zero amount", () => {
    expect(() => assertSufficientFunds(1000, 0)).toThrow(
      "Amount must be positive.",
    );
  });

  it("throws for a negative amount", () => {
    expect(() => assertSufficientFunds(1000, -1)).toThrow(
      "Amount must be positive.",
    );
  });

  it("throws when the balance is insufficient", () => {
    expect(() => assertSufficientFunds(100, 500)).toThrow(
      "Insufficient funds.",
    );
  });
});
