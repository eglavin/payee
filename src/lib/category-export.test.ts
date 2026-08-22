import { describe, expect, it } from "vitest";
import { buildCategoryExportJson, parseCategoryImport } from "./category-export";
import type { Category } from "./categories";

const sampleCategory: Category = {
  id: "pet-supplies",
  label: "Pet Supplies",
  color: "#ea580c",
  builtin: false,
};

describe("buildCategoryExportJson / parseCategoryImport", () => {
  it("round-trips custom categories and assignments", () => {
    const json = buildCategoryExportJson({
      customCategories: [sampleCategory],
      assignments: { "TESCO STORES": "groceries" },
    });

    const parsed = parseCategoryImport(json);

    expect(parsed.customCategories).toEqual([sampleCategory]);
    expect(parsed.assignments).toEqual({ "TESCO STORES": "groceries" });
  });

  it("forces builtin: false on every imported category, even if the file claims otherwise", () => {
    const json = JSON.stringify({
      version: 1,
      customCategories: [{ ...sampleCategory, builtin: true }],
      assignments: {},
    });

    const parsed = parseCategoryImport(json);

    expect(parsed.customCategories[0].builtin).toBe(false);
  });
});

describe("parseCategoryImport validation", () => {
  it("rejects invalid JSON", () => {
    expect(() => parseCategoryImport("not json")).toThrow(/valid JSON/);
  });

  it("rejects a JSON value that isn't an object", () => {
    expect(() => parseCategoryImport("42")).toThrow(/categories export/);
  });

  it("rejects a missing or malformed customCategories array", () => {
    expect(() => parseCategoryImport(JSON.stringify({ assignments: {} }))).toThrow(
      /custom categories/,
    );
    expect(() =>
      parseCategoryImport(
        JSON.stringify({ customCategories: [{ id: "x" }], assignments: {} }),
      ),
    ).toThrow(/custom categories/);
  });

  it("rejects a missing or malformed assignments map", () => {
    expect(() =>
      parseCategoryImport(JSON.stringify({ customCategories: [] })),
    ).toThrow(/category assignments/);
    expect(() =>
      parseCategoryImport(
        JSON.stringify({ customCategories: [], assignments: { a: 1 } }),
      ),
    ).toThrow(/category assignments/);
  });
});
