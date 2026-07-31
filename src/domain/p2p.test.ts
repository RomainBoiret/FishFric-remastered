import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSendP2PFrom,
  isP2PExpired,
  normalizeP2PAnswer,
  p2pExpiresAt,
} from "./p2p";
import { P2P_RULES } from "./money";

describe("canSendP2PFrom", () => {
  it("allows checking and savings only", () => {
    assert.equal(canSendP2PFrom("CHECKING"), true);
    assert.equal(canSendP2PFrom("SAVINGS"), true);
    assert.equal(canSendP2PFrom("CREDIT"), false);
  });
});

describe("p2pExpiresAt", () => {
  it("adds the configured expiry window", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const expires = p2pExpiresAt(from);
    const expected = new Date(from);
    expected.setDate(expected.getDate() + P2P_RULES.expiryDays);
    assert.equal(expires.getTime(), expected.getTime());
  });

  it("defaults from now", () => {
    const before = Date.now();
    const expires = p2pExpiresAt();
    assert.ok(expires.getTime() > before);
  });
});

describe("isP2PExpired", () => {
  it("detects expiry inclusively", () => {
    const expiresAt = new Date("2026-01-08T00:00:00.000Z");
    assert.equal(
      isP2PExpired(expiresAt, new Date("2026-01-07T23:59:59.000Z")),
      false,
    );
    assert.equal(
      isP2PExpired(expiresAt, new Date("2026-01-08T00:00:00.000Z")),
      true,
    );
  });
});

describe("normalizeP2PAnswer", () => {
  it("trims whitespace", () => {
    assert.equal(normalizeP2PAnswer("  reef  "), "reef");
  });
});
