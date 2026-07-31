import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertSufficientFunds,
  canOpenAccount,
  defaultAccountLabel,
  getOpenableAccountTypes,
  type AccountType,
} from "./accounts";

describe("canOpenAccount", () => {
  it("allows opening a checking account when none exists", () => {
    assert.equal(
      canOpenAccount({ type: "CHECKING", existingTypes: [], savingsCount: 0 })
        .ok,
      true,
    );
  });

  it("rejects a second checking account", () => {
    const result = canOpenAccount({
      type: "CHECKING",
      existingTypes: ["CHECKING"],
      savingsCount: 0,
    });
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /checking account already exists/i);
  });

  it("allows savings under the cap", () => {
    assert.equal(
      canOpenAccount({
        type: "SAVINGS",
        existingTypes: ["CHECKING"],
        savingsCount: 0,
      }).ok,
      true,
    );
  });

  it("rejects savings at the cap", () => {
    const result = canOpenAccount({
      type: "SAVINGS",
      existingTypes: ["CHECKING"],
      savingsCount: 3,
    });
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /maximum 3 savings/i);
  });

  it("allows a single Shark Card", () => {
    assert.equal(
      canOpenAccount({ type: "CREDIT", existingTypes: [], savingsCount: 0 })
        .ok,
      true,
    );
  });

  it("rejects a second Shark Card", () => {
    const result = canOpenAccount({
      type: "CREDIT",
      existingTypes: ["CREDIT"],
      savingsCount: 0,
    });
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /shark card already exists/i);
  });

  it("rejects an invalid account type", () => {
    const result = canOpenAccount({
      type: "NOPE" as AccountType,
      existingTypes: [],
      savingsCount: 0,
    });
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /invalid account type/i);
  });
});

describe("getOpenableAccountTypes", () => {
  it("lists only types still allowed", () => {
    assert.deepEqual(
      getOpenableAccountTypes({
        existingTypes: ["CHECKING", "CREDIT"],
        savingsCount: 1,
      }),
      ["SAVINGS"],
    );
  });

  it("returns empty when nothing can be opened", () => {
    assert.deepEqual(
      getOpenableAccountTypes({
        existingTypes: ["CHECKING", "CREDIT"],
        savingsCount: 3,
      }),
      [],
    );
  });
});

describe("defaultAccountLabel", () => {
  it("labels checking and credit", () => {
    assert.equal(defaultAccountLabel("CHECKING"), "Checking account");
    assert.equal(defaultAccountLabel("CREDIT"), "Shark Card");
  });

  it("labels the first savings simply", () => {
    assert.equal(defaultAccountLabel("SAVINGS", 0), "Savings account");
  });

  it("numbers later savings accounts", () => {
    assert.equal(defaultAccountLabel("SAVINGS", 1), "Savings account 2");
  });
});

describe("assertSufficientFunds", () => {
  it("passes when funds cover the amount", () => {
    assert.doesNotThrow(() => assertSufficientFunds(500, 100));
  });

  it("rejects non-positive amounts", () => {
    assert.throws(() => assertSufficientFunds(500, 0), /positive/i);
  });

  it("rejects insufficient balance", () => {
    assert.throws(() => assertSufficientFunds(50, 100), /insufficient/i);
  });
});
