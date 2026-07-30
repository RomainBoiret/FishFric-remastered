import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDepositTo,
  isAllowedDepositImage,
  validateMobileDeposit,
} from "./deposits";

describe("validateMobileDeposit", () => {
  it("accepts a checking deposit in range", () => {
    assert.equal(
      validateMobileDeposit({
        account: { id: "a1", type: "CHECKING" },
        amountCents: 25_000,
      }).ok,
      true,
    );
  });

  it("rejects credit accounts", () => {
    const result = validateMobileDeposit({
      account: { id: "c1", type: "CREDIT" },
      amountCents: 1000,
    });
    assert.equal(result.ok, false);
  });

  it("rejects amounts below the minimum", () => {
    const result = validateMobileDeposit({
      account: { id: "a1", type: "SAVINGS" },
      amountCents: 50,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /minimum/i);
  });
});

describe("canDepositTo", () => {
  it("allows checking and savings only", () => {
    assert.equal(canDepositTo("CHECKING"), true);
    assert.equal(canDepositTo("SAVINGS"), true);
    assert.equal(canDepositTo("CREDIT"), false);
  });
});

describe("isAllowedDepositImage", () => {
  it("accepts a small png", () => {
    assert.equal(
      isAllowedDepositImage({ type: "image/png", size: 12_000 }).ok,
      true,
    );
  });

  it("rejects oversized files", () => {
    const result = isAllowedDepositImage({
      type: "image/jpeg",
      size: 3 * 1024 * 1024,
    });
    assert.equal(result.ok, false);
  });
});
