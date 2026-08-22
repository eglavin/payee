import { describe, expect, it } from "vitest";
import { stripKnownPrefixes } from "./payee-prefixes";

describe("stripKnownPrefixes", () => {
  it("strips a known prefix case-insensitively while preserving the remainder's casing", () => {
    expect(stripKnownPrefixes("VDC-Tesco Stores")).toBe("Tesco Stores");
    expect(stripKnownPrefixes("Transfer from Jane Doe")).toBe("Jane Doe");
    expect(stripKnownPrefixes("TRANSFER TO John Smith")).toBe("John Smith");
  });

  it("leaves a payee with no known prefix unchanged (besides trimming)", () => {
    expect(stripKnownPrefixes("  Tesco Stores  ")).toBe("Tesco Stores");
  });
});
