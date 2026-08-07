import { formatMoney } from "@/domain/money";
import { parseAmountToCents } from "@/domain/transfers";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Local download filename only - never written into the repo. */
export function demoChequeFileName(
  amountCents: number,
  chequeId?: string,
): string {
  const amount = (amountCents / 100).toFixed(2);
  if (chequeId) {
    const short = chequeId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "cheque";
    return `fishfric-cheque-${amount}-${short}.svg`;
  }
  return `fishfric-cheque-${amount}.svg`;
}

export function isGeneratedChequeLabel(
  imageLabel: string | null | undefined,
): boolean {
  return (
    typeof imageLabel === "string" &&
    /^fishfric-cheque-\d+\.\d{2}(?:-[a-zA-Z0-9]+)?\.svg$/i.test(imageLabel)
  );
}

export function extractAmountCentsFromChequeFileName(
  fileName: string,
): number | null {
  const match = fileName
    .trim()
    .match(/^fishfric-cheque-(\d+)\.(\d{2})(?:-[a-zA-Z0-9]+)?\.svg$/i);
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2]);
}

/**
 * Read the face amount from a Fish&Fric demo cheque SVG.
 * Prefers the machine-readable data attribute embedded at generation time.
 */
export function extractAmountCentsFromChequeSvg(svg: string): number | null {
  const dataAttr = svg.match(/data-ff-amount-cents="(\d+)"/i);
  if (dataAttr) {
    const cents = Number(dataAttr[1]);
    return Number.isFinite(cents) ? cents : null;
  }

  const title = svg.match(/demo cheque\s+(\d+\.\d{2})/i);
  if (title) return parseAmountToCents(title[1]);

  const words = svg.match(/>(\d+) dollars and (\d{2})\/100</i);
  if (words) return Number(words[1]) * 100 + Number(words[2]);

  return null;
}

export type ChequeSecurityAttrs = {
  chequeId: string;
  signature: string;
  amountCents: number;
  payeeUserId: string;
  expiresAtMs: number;
};

/** Machine-readable anti-fraud fields embedded in issued SVG cheques. */
export function extractChequeSecurityFromSvg(
  svg: string,
): ChequeSecurityAttrs | null {
  const chequeId = svg.match(/data-ff-cheque-id="([^"]+)"/i)?.[1];
  const signature = svg.match(/data-ff-sig="([a-f0-9]+)"/i)?.[1];
  const amountRaw = svg.match(/data-ff-amount-cents="([^"]+)"/i)?.[1];
  const payeeUserId = svg.match(/data-ff-payee-user-id="([^"]+)"/i)?.[1];
  const expiresRaw = svg.match(/data-ff-exp="([^"]+)"/i)?.[1];

  if (!chequeId || !signature || !amountRaw || !payeeUserId || !expiresRaw) {
    return null;
  }

  const amountCents = Number(amountRaw);
  const expiresAtMs = Number(expiresRaw);
  if (!Number.isFinite(amountCents) || !Number.isFinite(expiresAtMs)) {
    return null;
  }

  return {
    chequeId,
    signature,
    amountCents,
    payeeUserId,
    expiresAtMs,
  };
}

export function resolveChequeFaceAmountCents(input: {
  fileName: string;
  svgText?: string | null;
}): number | null {
  // Prefer embedded SVG metadata (signed face) over the download filename.
  if (input.svgText) {
    const fromSvg = extractAmountCentsFromChequeSvg(input.svgText);
    if (fromSvg != null) return fromSvg;
  }
  return extractAmountCentsFromChequeFileName(input.fileName);
}

export function isFishFricDemoChequeSvg(svg: string): boolean {
  return (
    /data-ff-amount-cents="/i.test(svg) ||
    /data-ff-cheque-id="/i.test(svg) ||
    /Fish&amp;Fric demo cheque/i.test(svg) ||
    /OCEAN BANK - DEMO CHEQUE/i.test(svg)
  );
}

/** Best-effort English amount line for the demo cheque face. */
export function amountToChequeWords(amountCents: number): string {
  const dollars = Math.floor(amountCents / 100);
  const cents = amountCents % 100;
  const centPart = cents.toString().padStart(2, "0");
  return `${dollars} dollars and ${centPart}/100`;
}

export function buildDemoChequeSvg(input: {
  amountCents: number;
  payeeName: string;
  memo?: string;
  chequeNumber?: string;
  dateLabel?: string;
  /** Anti-fraud fields - required for cashable issued cheques */
  chequeId?: string;
  payeeUserId?: string;
  signature?: string;
  expiresAtMs?: number;
}): string {
  const amountLabel = formatMoney(input.amountCents, "en-CA");
  const payee = escapeXml(input.payeeName.trim() || "Fish&Fric customer");
  const memo = escapeXml(input.memo?.trim() || "Cheque deposit · fictional");
  const shortId =
    input.chequeId?.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() ??
    null;
  const chequeNumber = escapeXml(
    input.chequeNumber ?? shortId ?? "004821",
  );
  const dateLabel = escapeXml(
    input.dateLabel ??
      new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
        new Date(),
      ),
  );
  const words = escapeXml(amountToChequeWords(input.amountCents));
  const micrAmount = (input.amountCents / 100).toFixed(2);

  const securityAttrs = [
    `data-ff-amount-cents="${input.amountCents}"`,
    input.chequeId ? `data-ff-cheque-id="${escapeXml(input.chequeId)}"` : null,
    input.payeeUserId
      ? `data-ff-payee-user-id="${escapeXml(input.payeeUserId)}"`
      : null,
    input.signature ? `data-ff-sig="${escapeXml(input.signature)}"` : null,
    input.expiresAtMs != null
      ? `data-ff-exp="${input.expiresAtMs}"`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const securityBanner = input.chequeId
    ? `<text x="36" y="92" font-family="Courier New, monospace" font-size="10" fill="#2d8f83">ID ${escapeXml(input.chequeId)} · SIGNED · ONE-TIME</text>`
    : `<text x="36" y="92" font-family="Arial, sans-serif" font-size="10" fill="#8a6a2a">PREVIEW ONLY - NOT CASHABLE</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280" role="img" ${securityAttrs}>
  <title>Fish&amp;Fric demo cheque ${escapeXml(micrAmount)}</title>
  <desc>Fictional demo cheque - not a real banking instrument.</desc>
  <defs>
    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M16 0H0V16" fill="none" stroke="#c5d6de" stroke-width="0.6"/>
    </pattern>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4f7f8"/>
      <stop offset="100%" stop-color="#e4eef2"/>
    </linearGradient>
  </defs>
  <rect width="640" height="280" fill="url(#paper)"/>
  <rect width="640" height="280" fill="url(#grid)" opacity="0.55"/>
  <rect x="10" y="10" width="620" height="260" fill="none" stroke="#1e3a44" stroke-width="3"/>
  <rect x="16" y="16" width="608" height="248" fill="none" stroke="#e0aa2c" stroke-width="2"/>
  <text x="36" y="52" font-family="Georgia, serif" font-size="28" font-weight="700" fill="#0b1a22">Fish&amp;Fric</text>
  <text x="36" y="74" font-family="Arial, sans-serif" font-size="12" fill="#2f6f9f" letter-spacing="1.5">OCEAN BANK - DEMO CHEQUE</text>
  ${securityBanner}
  <text x="470" y="48" font-family="Courier New, monospace" font-size="14" fill="#1e3a44">No. ${chequeNumber}</text>
  <text x="470" y="68" font-family="Arial, sans-serif" font-size="11" fill="#5a7a86">${dateLabel}</text>
  <text x="36" y="118" font-family="Arial, sans-serif" font-size="11" fill="#5a7a86">PAY TO THE ORDER OF</text>
  <line x1="36" y1="144" x2="420" y2="144" stroke="#1e3a44" stroke-width="1.5"/>
  <text x="40" y="138" font-family="Georgia, serif" font-size="18" fill="#0b1a22">${payee}</text>
  <rect x="450" y="106" width="154" height="42" fill="#fff" stroke="#1e3a44" stroke-width="2"/>
  <text x="462" y="134" font-family="Courier New, monospace" font-size="20" font-weight="700" fill="#0b1a22">${escapeXml(amountLabel)}</text>
  <text x="36" y="168" font-family="Arial, sans-serif" font-size="11" fill="#5a7a86">AMOUNT</text>
  <line x1="36" y1="192" x2="500" y2="192" stroke="#1e3a44" stroke-width="1.5"/>
  <text x="40" y="186" font-family="Georgia, serif" font-size="14" font-style="italic" fill="#0b1a22">${words}</text>
  <text x="510" y="186" font-family="Arial, sans-serif" font-size="12" fill="#1e3a44">DOLLARS</text>
  <text x="36" y="220" font-family="Arial, sans-serif" font-size="11" fill="#5a7a86">MEMO</text>
  <line x1="80" y1="222" x2="280" y2="222" stroke="#1e3a44" stroke-width="1"/>
  <text x="86" y="218" font-family="Georgia, serif" font-size="13" fill="#2d8f83">${memo}</text>
  <text x="36" y="248" font-family="Courier New, monospace" font-size="13" fill="#1e3a44">001234567  987654321  ${chequeNumber}</text>
  <text x="400" y="220" font-family="Arial, sans-serif" font-size="11" fill="#5a7a86">AUTHORIZED SIGNATURE</text>
  <path d="M410 248 C430 228, 460 258, 490 236 C510 222, 540 250, 560 238" fill="none" stroke="#0b1a22" stroke-width="2"/>
  <line x1="400" y1="252" x2="580" y2="252" stroke="#1e3a44" stroke-width="1"/>
  <g transform="translate(590 34)">
    <ellipse cx="0" cy="0" rx="14" ry="8" fill="#2d8f83"/>
    <polygon points="12,0 22,-7 22,7" fill="#2d8f83"/>
    <circle cx="-5" cy="-2" r="1.5" fill="#0b1a22"/>
  </g>
</svg>`;
}

export function chequeSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
