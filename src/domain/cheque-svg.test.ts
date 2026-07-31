import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  amountToChequeWords,
  buildDemoChequeSvg,
  chequeSvgDataUri,
  demoChequeFileName,
  extractAmountCentsFromChequeFileName,
  extractAmountCentsFromChequeSvg,
  extractChequeSecurityFromSvg,
  isFishFricDemoChequeSvg,
  isGeneratedChequeLabel,
  resolveChequeFaceAmountCents,
} from "./cheque-svg";

describe("demoChequeFileName", () => {
  it("builds plain and signed names", () => {
    assert.equal(demoChequeFileName(6000), "fishfric-cheque-60.00.svg");
    assert.match(demoChequeFileName(6000, "c!!id"), /fishfric-cheque-60\.00-/);
  });

  it("falls back when the id is empty after sanitizing", () => {
    assert.equal(
      demoChequeFileName(100, "!!!"),
      "fishfric-cheque-1.00-cheque.svg",
    );
  });
});

describe("isGeneratedChequeLabel", () => {
  it("detects generated labels", () => {
    assert.equal(isGeneratedChequeLabel("fishfric-cheque-60.00.svg"), true);
    assert.equal(
      isGeneratedChequeLabel("fishfric-cheque-60.00-ab12cd34.svg"),
      true,
    );
    assert.equal(isGeneratedChequeLabel(null), false);
    assert.equal(isGeneratedChequeLabel("photo.png"), false);
  });
});

describe("extractAmountCentsFromChequeFileName", () => {
  it("returns null for unrelated names", () => {
    assert.equal(extractAmountCentsFromChequeFileName("nope.svg"), null);
  });
});

describe("extractAmountCentsFromChequeSvg", () => {
  it("parses title and words fallbacks", () => {
    assert.equal(
      extractAmountCentsFromChequeSvg(
        `<svg><title>demo cheque 12.34</title></svg>`,
      ),
      1234,
    );
    assert.equal(
      extractAmountCentsFromChequeSvg(
        `<svg><text>12 dollars and 05/100</text></svg>`,
      ),
      1205,
    );
    assert.equal(extractAmountCentsFromChequeSvg("<svg></svg>"), null);
  });

  it("ignores non-finite data attributes", () => {
    assert.equal(
      extractAmountCentsFromChequeSvg(
        `<svg data-ff-amount-cents="not-a-number"></svg>`,
      ),
      null,
    );
  });
});

describe("extractChequeSecurityFromSvg", () => {
  it("returns null when fields are incomplete or non-finite", () => {
    assert.equal(extractChequeSecurityFromSvg("<svg></svg>"), null);
    assert.equal(
      extractChequeSecurityFromSvg(
        `<svg data-ff-cheque-id="c1" data-ff-sig="abc" data-ff-amount-cents="NaN" data-ff-payee-user-id="u" data-ff-exp="1"></svg>`,
      ),
      null,
    );
    assert.equal(
      extractChequeSecurityFromSvg(
        `<svg data-ff-cheque-id="c1" data-ff-sig="abc" data-ff-amount-cents="100" data-ff-payee-user-id="u" data-ff-exp="Infinity"></svg>`,
      ),
      null,
    );
  });

  it("parses a complete security block", () => {
    const attrs = extractChequeSecurityFromSvg(
      `<svg data-ff-cheque-id="c1" data-ff-sig="deadbeef" data-ff-amount-cents="1200" data-ff-payee-user-id="u1" data-ff-exp="99"></svg>`,
    );
    assert.deepEqual(attrs, {
      chequeId: "c1",
      signature: "deadbeef",
      amountCents: 1200,
      payeeUserId: "u1",
      expiresAtMs: 99,
    });
  });
});

describe("resolveChequeFaceAmountCents", () => {
  it("uses the filename when svgText is omitted", () => {
    assert.equal(
      resolveChequeFaceAmountCents({
        fileName: "fishfric-cheque-60.00.svg",
      }),
      6000,
    );
  });
});

describe("isFishFricDemoChequeSvg", () => {
  it("detects demo markers", () => {
    assert.equal(isFishFricDemoChequeSvg(`data-ff-amount-cents="1"`), true);
    assert.equal(isFishFricDemoChequeSvg(`data-ff-cheque-id="c"`), true);
    assert.equal(
      isFishFricDemoChequeSvg(`Fish&amp;Fric demo cheque`),
      true,
    );
    assert.equal(isFishFricDemoChequeSvg(`OCEAN BANK - DEMO CHEQUE`), true);
    assert.equal(isFishFricDemoChequeSvg(`<svg></svg>`), false);
  });
});

describe("amountToChequeWords + buildDemoChequeSvg", () => {
  it("renders words and escapes payee/memo", () => {
    assert.equal(amountToChequeWords(1205), "12 dollars and 05/100");
    const svg = buildDemoChequeSvg({
      amountCents: 2500,
      payeeName: `A&B <C> "D" 'E'`,
      memo: `Memo & notes`,
      chequeNumber: "99",
      dateLabel: "Jul 1, 2026",
    });
    assert.match(svg, /A&amp;B/);
    assert.match(svg, /PREVIEW ONLY/);
    assert.ok(isFishFricDemoChequeSvg(svg));
  });

  it("renders the signed banner when a cheque id is present", () => {
    const svg = buildDemoChequeSvg({
      amountCents: 1000,
      payeeName: "Pat",
      chequeId: "cid",
    });
    assert.match(svg, /SIGNED · ONE-TIME/);
  });

  it("defaults cheque number when id and number are omitted", () => {
    const svg = buildDemoChequeSvg({
      amountCents: 500,
      payeeName: "Sam",
    });
    assert.match(svg, /004821/);
  });

  it("uses a sanitized short id as the cheque number", () => {
    const svg = buildDemoChequeSvg({
      amountCents: 500,
      payeeName: "Sam",
      chequeId: "xx!!abcdef",
    });
    assert.match(svg, /ABCDEF/);
  });
});

describe("chequeSvgDataUri", () => {
  it("wraps svg as a data uri", () => {
    assert.match(chequeSvgDataUri("<svg></svg>"), /^data:image\/svg\+xml/);
  });
});
