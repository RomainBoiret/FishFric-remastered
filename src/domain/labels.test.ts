import { describe, expect, it } from "vitest";
import { formatDateTime } from "@/domain/labels";

describe("formatDateTime", () => {
  it("formats a date with medium date style and short time style", () => {
    const date = new Date(Date.UTC(2026, 6, 29, 14, 30));
    const formatted = formatDateTime(date, "en-CA");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it("respects the provided locale", () => {
    const date = new Date(Date.UTC(2026, 6, 29, 14, 30));
    expect(formatDateTime(date, "fr-CA")).toContain("2026");
  });
});
