import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBillPayee, validateBillPayment } from "./bills";

describe("validateBillPayment", () => {
  const checking = {
    id: "a1",
    type: "CHECKING" as const,
    balanceCents: 50_000,
    creditLimitCents: null,
  };

  it("accepts a valid checking payment", () => {
    const result = validateBillPayment({
      from: checking,
      payeeId: "ocean-hydro",
      amountCents: 12_000,
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.payeeName, "Ocean Hydro");
  });

  it("rejects an unknown payee", () => {
    const result = validateBillPayment({
      from: checking,
      payeeId: "nope",
      amountCents: 1000,
    });
    assert.equal(result.ok, false);
  });

  it("rejects insufficient funds", () => {
    const result = validateBillPayment({
      from: checking,
      payeeId: "reef-mobile",
      amountCents: 60_000,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /insufficient funds/i);
  });

  it("allows Shark Card spend within the limit", () => {
    const result = validateBillPayment({
      from: {
        id: "c1",
        type: "CREDIT",
        balanceCents: -10_000,
        creditLimitCents: -500_000,
      },
      payeeId: "wave-insurance",
      amountCents: 20_000,
    });
    assert.equal(result.ok, true);
  });

  it("rejects Shark Card spend past the limit", () => {
    const result = validateBillPayment({
      from: {
        id: "c1",
        type: "CREDIT",
        balanceCents: -490_000,
        creditLimitCents: -500_000,
      },
      payeeId: "coralville",
      amountCents: 20_000,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /credit limit/i);
  });
});

describe("getBillPayee", () => {
  it("finds a known payee", () => {
    assert.equal(getBillPayee("ocean-hydro")?.name, "Ocean Hydro");
  });
});
