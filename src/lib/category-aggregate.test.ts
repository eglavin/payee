import { describe, expect, it } from "vitest";
import { topCategoriesBySpend } from "./category-aggregate";
import type { Category } from "./categories";
import type { PayeeSummary } from "./types";

function makeSummary(overrides: Partial<PayeeSummary>): PayeeSummary {
  return {
    payee: "PAYEE",
    totalDebit: 0,
    totalCredit: 0,
    net: 0,
    count: 1,
    currency: "EUR",
    transactions: [],
    variants: [],
    ...overrides,
  };
}

const categories: Category[] = [
  { id: "groceries", label: "Groceries", color: "#16a34a", builtin: true },
  { id: "takeout", label: "Takeout & Restaurants", color: "#ea580c", builtin: true },
];

describe("topCategoriesBySpend", () => {
  it("sums spend across payees sharing a category", () => {
    const summaries = [
      makeSummary({ payee: "TESCO", totalDebit: 40 }),
      makeSummary({ payee: "LIDL", totalDebit: 30 }),
      makeSummary({ payee: "DOMINOS", totalDebit: 20 }),
    ];
    const getCategoryId = (payee: string) =>
      ({ TESCO: "groceries", LIDL: "groceries", DOMINOS: "takeout" })[payee];

    const result = topCategoriesBySpend(summaries, getCategoryId, categories, 8);

    expect(result).toEqual([
      { categoryId: "groceries", label: "Groceries", color: "#16a34a", spend: 70 },
      { categoryId: "takeout", label: "Takeout & Restaurants", color: "#ea580c", spend: 20 },
    ]);
  });

  it("folds payees with no assigned category into a single Uncategorized bucket", () => {
    const summaries = [
      makeSummary({ payee: "TESCO", totalDebit: 40 }),
      makeSummary({ payee: "RANDOM SHOP", totalDebit: 10 }),
    ];
    const getCategoryId = (payee: string) => (payee === "TESCO" ? "groceries" : undefined);

    const result = topCategoriesBySpend(summaries, getCategoryId, categories, 8);

    expect(result).toContainEqual({
      categoryId: "__uncategorized__",
      label: "Uncategorized",
      color: "#94a3b8",
      spend: 10,
    });
  });

  it("ignores payees with no net spend (refund-only or income)", () => {
    const summaries = [
      makeSummary({ payee: "SALARY", totalDebit: 0, totalCredit: 2000 }),
      makeSummary({ payee: "TESCO", totalDebit: 40 }),
    ];
    const getCategoryId = () => "groceries";

    const result = topCategoriesBySpend(summaries, getCategoryId, categories, 8);

    expect(result).toEqual([
      { categoryId: "groceries", label: "Groceries", color: "#16a34a", spend: 40 },
    ]);
  });

  it("limits to the top n categories by spend", () => {
    const summaries = [
      makeSummary({ payee: "A", totalDebit: 10 }),
      makeSummary({ payee: "B", totalDebit: 20 }),
    ];
    const getCategoryId = (payee: string) => (payee === "A" ? "groceries" : "takeout");

    const result = topCategoriesBySpend(summaries, getCategoryId, categories, 1);

    expect(result).toEqual([
      { categoryId: "takeout", label: "Takeout & Restaurants", color: "#ea580c", spend: 20 },
    ]);
  });
});
