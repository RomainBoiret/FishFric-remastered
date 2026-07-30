import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateChequeForDeposit,
  signChequePayload,
  verifyChequeSignature,
} from "./cheque-security";

const secret = "test-cheque-secret";

describe("cheque HMAC", () => {
  it("signs and verifies a payload", () => {
    const payload = {
      chequeId: "cabc123",
      amountCents: 12_000,
      payeeUserId: "user_1",
      expiresAtMs: Date.now() + 60_000,
    };
    const signature = signChequePayload(payload, secret);
    assert.equal(verifyChequeSignature(payload, signature, secret), true);
    assert.equal(
      verifyChequeSignature(
        { ...payload, amountCents: 12_001 },
        signature,
        secret,
      ),
      false,
    );
  });
});

describe("evaluateChequeForDeposit", () => {
  const base = {
    id: "c1",
    amountCents: 6000,
    payeeUserId: "payee",
    signature: "sig",
    status: "ISSUED" as const,
    expiresAt: new Date(Date.now() + 60_000),
  };

  it("accepts a valid issued cheque for the payee", () => {
    assert.equal(
      evaluateChequeForDeposit({
        instrument: base,
        depositAmountCents: 6000,
        depositorUserId: "payee",
        presentedSignature: "sig",
      }).ok,
      true,
    );
  });

  it("rejects double cash", () => {
    const result = evaluateChequeForDeposit({
      instrument: { ...base, status: "CLEARED" },
      depositAmountCents: 6000,
      depositorUserId: "payee",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /already cashed/i);
  });

  it("rejects payee mismatch", () => {
    const result = evaluateChequeForDeposit({
      instrument: base,
      depositAmountCents: 6000,
      depositorUserId: "someone-else",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /payee/i);
  });

  it("rejects amount mismatch", () => {
    const result = evaluateChequeForDeposit({
      instrument: base,
      depositAmountCents: 9000,
      depositorUserId: "payee",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /60\.00|90\.00/);
  });

  it("rejects presented signature tampering", () => {
    const result = evaluateChequeForDeposit({
      instrument: base,
      depositAmountCents: 6000,
      depositorUserId: "payee",
      presentedSignature: "tampered",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /tamper|signature/i);
  });

  it("rejects expired cheques", () => {
    const result = evaluateChequeForDeposit({
      instrument: {
        ...base,
        expiresAt: new Date(Date.now() - 1000),
      },
      depositAmountCents: 6000,
      depositorUserId: "payee",
      now: new Date(),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /expired/i);
  });
});
