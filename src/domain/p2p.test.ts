import { describe, expect, it } from "vitest";
import {
  canSendP2PFrom,
  isP2PExpired,
  normalizeP2PAnswer,
  p2pExpiresAt,
} from "@/domain/p2p";
import { P2P_RULES } from "@/domain/money";

describe("canSendP2PFrom", () => {
  it("allows checking and savings", () => {
    expect(canSendP2PFrom("CHECKING")).toBe(true);
    expect(canSendP2PFrom("SAVINGS")).toBe(true);
  });

  it("disallows credit", () => {
    expect(canSendP2PFrom("CREDIT")).toBe(false);
  });
});

describe("p2pExpiresAt", () => {
  it("adds the configured expiry window to the given date", () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const expires = p2pExpiresAt(from);
    const diffDays =
      (expires.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(P2P_RULES.expiryDays);
  });

  it("does not mutate the input date", () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const before = from.getTime();
    p2pExpiresAt(from);
    expect(from.getTime()).toBe(before);
  });
});

describe("isP2PExpired", () => {
  it("is false before the expiry instant", () => {
    const expiresAt = new Date(Date.UTC(2026, 0, 8));
    const now = new Date(Date.UTC(2026, 0, 7));
    expect(isP2PExpired(expiresAt, now)).toBe(false);
  });

  it("is true at and after the expiry instant", () => {
    const expiresAt = new Date(Date.UTC(2026, 0, 8));
    expect(isP2PExpired(expiresAt, expiresAt)).toBe(true);
    expect(isP2PExpired(expiresAt, new Date(Date.UTC(2026, 0, 9)))).toBe(
      true,
    );
  });
});

describe("normalizeP2PAnswer", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeP2PAnswer("  Blue  ")).toBe("Blue");
  });

  it("preserves internal whitespace and case", () => {
    expect(normalizeP2PAnswer(" My Answer ")).toBe("My Answer");
  });
});
