import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  evaluateChequeForDeposit,
  getChequeHmacSecret,
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

  it("rejects voided cheques", () => {
    const result = evaluateChequeForDeposit({
      instrument: { ...base, status: "VOID" },
      depositAmountCents: 6000,
      depositorUserId: "payee",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /void/i);
  });

  it("rejects unknown statuses", () => {
    const result = evaluateChequeForDeposit({
      instrument: {
        ...base,
        status: "PENDING" as "ISSUED",
      },
      depositAmountCents: 6000,
      depositorUserId: "payee",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /cannot be deposited/i);
  });

  it("allows empty presented signatures", () => {
    assert.equal(
      evaluateChequeForDeposit({
        instrument: base,
        depositAmountCents: 6000,
        depositorUserId: "payee",
        presentedSignature: "",
      }).ok,
      true,
    );
  });

  it("re-checks HMAC when a secret is provided", () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const payload = {
      chequeId: base.id,
      amountCents: base.amountCents,
      payeeUserId: base.payeeUserId,
      expiresAtMs: expiresAt.getTime(),
    };
    const signature = signChequePayload(payload, secret);
    assert.equal(
      evaluateChequeForDeposit({
        instrument: { ...base, signature, expiresAt },
        depositAmountCents: 6000,
        depositorUserId: "payee",
        hmacSecret: secret,
      }).ok,
      true,
    );

    const bad = evaluateChequeForDeposit({
      instrument: { ...base, signature: "deadbeef", expiresAt },
      depositAmountCents: 6000,
      depositorUserId: "payee",
      hmacSecret: secret,
    });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.match(bad.reason, /integrity/i);
  });
});

describe("verifyChequeSignature edges", () => {
  it("rejects length-mismatched signatures", () => {
    const payload = {
      chequeId: "c1",
      amountCents: 100,
      payeeUserId: "u",
      expiresAtMs: 1,
    };
    assert.equal(verifyChequeSignature(payload, "short", secret), false);
  });

  it("returns false when the timing-safe compare throws", () => {
    const payload = {
      chequeId: "c1",
      amountCents: 100,
      payeeUserId: "u",
      expiresAtMs: 1,
    };
    const signature = signChequePayload(payload, secret);
    const original = Buffer.from.bind(Buffer);
    mock.method(Buffer, "from", (...args: unknown[]) => {
      if (args[1] === "utf8") throw new Error("compare failed");
      return original(...(args as Parameters<typeof Buffer.from>));
    });
    try {
      assert.equal(verifyChequeSignature(payload, signature, secret), false);
    } finally {
      mock.restoreAll();
    }
  });
});

describe("getChequeHmacSecret", () => {
  it("reads AUTH_SECRET", () => {
    const prev = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "  reef-secret  ";
    try {
      assert.equal(getChequeHmacSecret(), "reef-secret");
    } finally {
      if (prev === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = prev;
    }
  });

  it("throws when AUTH_SECRET is missing or blank", () => {
    const prev = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    try {
      assert.throws(() => getChequeHmacSecret(), /AUTH_SECRET/);
      process.env.AUTH_SECRET = "   ";
      assert.throws(() => getChequeHmacSecret(), /AUTH_SECRET/);
    } finally {
      if (prev === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = prev;
    }
  });
});
