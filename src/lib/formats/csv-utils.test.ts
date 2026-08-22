import { describe, expect, it } from "vitest";
import {
  isBlankRow,
  matchesExactHeader,
  parseAmount,
  parseNullableAmount,
} from "./csv-utils";

describe("parseAmount", () => {
  it("parses a plain numeric string", () => {
    expect(parseAmount("45.20")).toBe(45.2);
  });

  it("strips thousands-separator commas", () => {
    expect(parseAmount("1,234.56")).toBe(1234.56);
  });

  it("defaults blank or missing values to 0", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount("   ")).toBe(0);
  });

  it("defaults an unparseable value to 0", () => {
    expect(parseAmount("abc")).toBe(0);
  });
});

describe("parseNullableAmount", () => {
  it("parses a plain numeric string", () => {
    expect(parseNullableAmount("100")).toBe(100);
  });

  it("returns null for blank or missing values", () => {
    expect(parseNullableAmount("")).toBeNull();
    expect(parseNullableAmount(undefined)).toBeNull();
  });
});

describe("isBlankRow", () => {
  it("is true when every field is empty or missing", () => {
    expect(isBlankRow({ a: "", b: undefined, c: "  " })).toBe(true);
  });

  it("is false when any field has content", () => {
    expect(isBlankRow({ a: "", b: "x" })).toBe(false);
  });
});

describe("matchesExactHeader", () => {
  const matches = matchesExactHeader("Type,Product,Amount");

  it("matches the same header regardless of case or whitespace", () => {
    expect(matches("Type,Product,Amount")).toBe(true);
    expect(matches(" type , product , amount ")).toBe(true);
  });

  it("does not match a different header", () => {
    expect(matches("Type,Product")).toBe(false);
    expect(matches("Foo,Bar,Baz")).toBe(false);
  });
});
