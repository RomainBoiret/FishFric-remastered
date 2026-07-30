import { createHmac, timingSafeEqual } from "node:crypto";

export const CHEQUE_SECURITY = {
  /** Issued cheques expire after 24h in the demo. */
  ttlMs: 24 * 60 * 60 * 1000,
  hmacAlgorithm: "sha256",
} as const;

export type ChequeSignPayload = {
  chequeId: string;
  amountCents: number;
  payeeUserId: string;
  /** Unix epoch milliseconds */
  expiresAtMs: number;
};

export function chequeCanonicalString(payload: ChequeSignPayload): string {
  return [
    payload.chequeId,
    String(payload.amountCents),
    payload.payeeUserId,
    String(payload.expiresAtMs),
  ].join("|");
}

export function signChequePayload(
  payload: ChequeSignPayload,
  secret: string,
): string {
  return createHmac(CHEQUE_SECURITY.hmacAlgorithm, secret)
    .update(chequeCanonicalString(payload))
    .digest("hex");
}

export function verifyChequeSignature(
  payload: ChequeSignPayload,
  signature: string,
  secret: string,
): boolean {
  const expected = signChequePayload(payload, secret);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  } catch {
    return false;
  }
}

export type ChequeInstrumentSnapshot = {
  id: string;
  amountCents: number;
  payeeUserId: string;
  signature: string;
  status: "ISSUED" | "CLEARED" | "VOID";
  expiresAt: Date;
};

/** Pure rules for clearing a signed demo cheque (DB is source of truth). */
export function evaluateChequeForDeposit(input: {
  instrument: ChequeInstrumentSnapshot;
  depositAmountCents: number;
  depositorUserId: string;
  /** Signature embedded in the presented SVG/file, if any */
  presentedSignature?: string | null;
  /** Optional HMAC re-check when secret is available */
  hmacSecret?: string | null;
  now?: Date;
}): { ok: true } | { ok: false; reason: string } {
  const now = input.now ?? new Date();
  const { instrument } = input;

  if (instrument.status === "CLEARED") {
    return {
      ok: false,
      reason: "This cheque was already cashed (one-time use).",
    };
  }

  if (instrument.status === "VOID") {
    return { ok: false, reason: "This cheque has been voided." };
  }

  if (instrument.status !== "ISSUED") {
    return { ok: false, reason: "This cheque cannot be deposited." };
  }

  if (instrument.expiresAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      reason: "This cheque has expired. Issue a new one and try again.",
    };
  }

  if (instrument.payeeUserId !== input.depositorUserId) {
    return {
      ok: false,
      reason: "Payee mismatch: only the named recipient can cash this cheque.",
    };
  }

  if (instrument.amountCents !== input.depositAmountCents) {
    return {
      ok: false,
      reason: `Cheque face is $${(instrument.amountCents / 100).toFixed(2)} but deposit amount is $${(input.depositAmountCents / 100).toFixed(2)}.`,
    };
  }

  if (
    input.presentedSignature != null &&
    input.presentedSignature.length > 0 &&
    input.presentedSignature !== instrument.signature
  ) {
    return {
      ok: false,
      reason: "Cheque signature does not match bank records (possible tampering).",
    };
  }

  if (input.hmacSecret) {
    const valid = verifyChequeSignature(
      {
        chequeId: instrument.id,
        amountCents: instrument.amountCents,
        payeeUserId: instrument.payeeUserId,
        expiresAtMs: instrument.expiresAt.getTime(),
      },
      instrument.signature,
      input.hmacSecret,
    );
    if (!valid) {
      return {
        ok: false,
        reason: "Cheque integrity check failed. Re-issue the cheque.",
      };
    }
  }

  return { ok: true };
}

export function getChequeHmacSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required to sign demo cheques.");
  }
  return secret;
}
