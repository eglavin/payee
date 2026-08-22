import { describe, expect, it } from "vitest";
import { BUILT_IN_CATEGORIES, getCategoryKey } from "./categories";

describe("BUILT_IN_CATEGORIES", () => {
  it("has unique ids", () => {
    const ids = BUILT_IN_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getCategoryKey", () => {
  it("normalizes case, whitespace, and trailing store numbers so tags reattach across uploads", () => {
    expect(getCategoryKey("Tesco Stores 123")).toBe(getCategoryKey("TESCO STORES 456"));
    expect(getCategoryKey("  Tesco   Stores  ")).toBe(getCategoryKey("Tesco Stores"));
  });
});
