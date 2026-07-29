import { describe, expect, it } from "vitest";
import { formatMoney } from "@/domain/money";

describe("formatMoney", () => {
  it("formats positive cents as CAD currency", () => {
    expect(formatMoney(150_00)).toBe("$150.00");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("formats negative cents (owed amounts)", () => {
    expect(formatMoney(-500_00)).toBe("-$500.00");
  });

  it("rounds sub-cent input to the nearest cent", () => {
    expect(formatMoney(1)).toBe("$0.01");
  });

  it("respects the provided locale", () => {
    // loose match, ICU puts a NBSP before the $
    expect(formatMoney(150_00, "fr-CA")).toMatch(/^150,00\s*\$$/);
  });
});
