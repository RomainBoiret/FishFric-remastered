import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ConcurrentModificationError } from "./account-balance";

describe("ConcurrentModificationError", () => {
  it("exposes a stable name for action catch paths", () => {
    const err = new ConcurrentModificationError("retry");
    assert.equal(err.name, "ConcurrentModificationError");
    assert.equal(err.message, "retry");
    assert.ok(err instanceof Error);
  });
});
