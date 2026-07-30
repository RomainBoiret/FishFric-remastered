import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDemoChequeSvg,
  demoChequeFileName,
  extractAmountCentsFromChequeFileName,
  extractAmountCentsFromChequeSvg,
  extractChequeSecurityFromSvg,
  resolveChequeFaceAmountCents,
} from "./cheque-svg";
import {
  canDepositTo,
  isAllowedDepositImage,
  validateChequeFaceMatchesDeposit,
  validateGeneratedChequeAmount,
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

describe("cheque face amount parsing", () => {
  it("reads amount from filename", () => {
    assert.equal(
      extractAmountCentsFromChequeFileName("fishfric-cheque-60.00.svg"),
      6000,
    );
  });

  it("reads amount from signed filename", () => {
    assert.equal(
      extractAmountCentsFromChequeFileName(
        "fishfric-cheque-60.00-ab12cd34.svg",
      ),
      6000,
    );
  });

  it("reads amount from generated SVG data attribute", () => {
    const svg = buildDemoChequeSvg({
      amountCents: 6000,
      payeeName: "Aqua Recruiter",
    });
    assert.equal(extractAmountCentsFromChequeSvg(svg), 6000);
  });

  it("extracts security attrs from signed SVG", () => {
    const svg = buildDemoChequeSvg({
      amountCents: 6000,
      payeeName: "Aqua Recruiter",
      chequeId: "cchequeid001",
      payeeUserId: "user_1",
      signature: "abc123def",
      expiresAtMs: 1_700_000_000_000,
    });
    const security = extractChequeSecurityFromSvg(svg);
    assert.ok(security);
    assert.equal(security?.chequeId, "cchequeid001");
    assert.equal(security?.amountCents, 6000);
    assert.equal(security?.payeeUserId, "user_1");
    assert.equal(security?.signature, "abc123def");
  });

  it("rejects upload face vs deposit mismatch", () => {
    const result = validateChequeFaceMatchesDeposit({
      amountCents: 9000,
      faceAmountCents: 6000,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /60\.00/);
  });

  it("resolves face amount preferring SVG metadata over filename", () => {
    assert.equal(
      resolveChequeFaceAmountCents({
        fileName: "fishfric-cheque-60.00.svg",
        svgText: buildDemoChequeSvg({
          amountCents: 9000,
          payeeName: "X",
        }),
      }),
      9000,
    );
  });

  it("falls back to filename when SVG has no amount metadata", () => {
    assert.equal(
      resolveChequeFaceAmountCents({
        fileName: "fishfric-cheque-60.00.svg",
        svgText: "<svg></svg>",
      }),
      6000,
    );
  });
});

describe("validateGeneratedChequeAmount", () => {
  it("accepts matching amount and filename", () => {
    assert.equal(
      validateGeneratedChequeAmount({
        amountCents: 12_000,
        chequeAmountCents: 12_000,
        chequeFileName: demoChequeFileName(12_000),
      }).ok,
      true,
    );
  });

  it("accepts signed filename with cheque id", () => {
    assert.equal(
      validateGeneratedChequeAmount({
        amountCents: 12_000,
        chequeAmountCents: 12_000,
        chequeFileName: demoChequeFileName(12_000, "cchequeid001"),
        chequeId: "cchequeid001",
      }).ok,
      true,
    );
  });

  it("rejects a mismatched face amount", () => {
    const result = validateGeneratedChequeAmount({
      amountCents: 12_000,
      chequeAmountCents: 15_000,
      chequeFileName: demoChequeFileName(12_000),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /150\.00|120\.00/i);
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
