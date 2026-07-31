import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACCOUNT_TYPE_LABELS,
  ENTRY_KIND_LABELS,
  formatDateTime,
} from "./labels";
import { ACCOUNT_RULES, formatMoney, P2P_RULES } from "./money";
import { NOTIFICATION_RULES } from "./notifications";
import { ACCOUNT_HISTORY_RULES } from "./ledger";

describe("labels", () => {
  it("exposes account and entry labels", () => {
    assert.equal(ACCOUNT_TYPE_LABELS.CREDIT, "Shark Card");
    assert.equal(ENTRY_KIND_LABELS.MOBILE_DEPOSIT, "Deposit");
  });

  it("formats dates", () => {
    const text = formatDateTime(new Date("2026-07-01T15:30:00"));
    assert.ok(text.length > 0);
    const fr = formatDateTime(new Date("2026-07-01T15:30:00"), "fr-CA");
    assert.ok(fr.length > 0);
  });
});

describe("money", () => {
  it("formats CAD amounts", () => {
    assert.match(formatMoney(12345), /123\.45/);
    assert.match(formatMoney(12345, "fr-CA"), /123/);
  });

  it("exposes business constants", () => {
    assert.equal(ACCOUNT_RULES.maxSavingsAccounts, 3);
    assert.equal(P2P_RULES.expiryDays, 7);
  });
});

describe("notification + history rules", () => {
  it("keeps inbox and history caps aligned with product rules", () => {
    assert.equal(NOTIFICATION_RULES.maxPerUser, 10);
    assert.equal(NOTIFICATION_RULES.listTake, 10);
    assert.deepEqual({ ...NOTIFICATION_RULES }, { maxPerUser: 10, listTake: 10 });
    assert.equal(ACCOUNT_HISTORY_RULES.maxVisiblePerAccount, 10);
    assert.equal(ACCOUNT_HISTORY_RULES.listTake, 10);
  });
});
