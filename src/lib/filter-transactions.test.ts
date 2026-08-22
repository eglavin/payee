import { describe, expect, it } from "vitest";
import {
  emptyFilters,
  filterTransactions,
  getAvailableBanks,
  getDateBounds,
  getDatePresets,
  hasActiveFilters,
  UNCATEGORIZED_FILTER_VALUE,
} from "./filter-transactions";
import { makeTransaction as txn } from "./test-fixtures";

describe("hasActiveFilters", () => {
  it("is false for the empty filter set", () => {
    expect(hasActiveFilters(emptyFilters)).toBe(false);
  });

  it("is true when any single field is set", () => {
    expect(hasActiveFilters({ ...emptyFilters, payeeSearch: "tesco" })).toBe(true);
    expect(hasActiveFilters({ ...emptyFilters, minAmount: 10 })).toBe(true);
    expect(hasActiveFilters({ ...emptyFilters, dateFrom: new Date() })).toBe(true);
    expect(hasActiveFilters({ ...emptyFilters, bank: "AIB" })).toBe(true);
    expect(hasActiveFilters({ ...emptyFilters, category: "groceries" })).toBe(true);
  });
});

describe("filterTransactions", () => {
  it("returns everything unchanged when no filters are active", () => {
    const transactions = [txn({ payee: "A" }), txn({ payee: "B" })];
    expect(filterTransactions(transactions, emptyFilters)).toEqual(transactions);
  });

  it("filters by inclusive date range", () => {
    const transactions = [
      txn({ date: new Date(2024, 0, 1) }),
      txn({ date: new Date(2024, 0, 15) }),
      txn({ date: new Date(2024, 0, 31) }),
    ];

    const result = filterTransactions(transactions, {
      ...emptyFilters,
      dateFrom: new Date(2024, 0, 1),
      dateTo: new Date(2024, 0, 15),
    });

    expect(result).toHaveLength(2);
  });

  it("matches payee search case-insensitively as a substring", () => {
    const transactions = [
      txn({ payee: "Tesco Stores" }),
      txn({ payee: "SUPERMACS" }),
    ];

    const result = filterTransactions(transactions, {
      ...emptyFilters,
      payeeSearch: "tesco",
    });

    expect(result).toEqual([transactions[0]]);
  });

  it("filters by amount range using whichever side (debit/credit) is nonzero", () => {
    const transactions = [
      txn({ debit: 5 }),
      txn({ debit: 50 }),
      txn({ credit: 500 }),
    ];

    const result = filterTransactions(transactions, {
      ...emptyFilters,
      minAmount: 10,
      maxAmount: 100,
    });

    expect(result).toEqual([transactions[1]]);
  });

  it("filters by bank/source", () => {
    const transactions = [
      txn({ payee: "TESCO", source: "AIB" }),
      txn({ payee: "DAYBREAK", source: "Revolut" }),
    ];

    const result = filterTransactions(transactions, { ...emptyFilters, bank: "Revolut" });

    expect(result).toEqual([transactions[1]]);
  });

  it("filters by category id using a getCategoryId resolver", () => {
    const transactions = [
      txn({ payee: "TESCO" }),
      txn({ payee: "DOMINOS" }),
      txn({ payee: "NETFLIX" }),
    ];
    const getCategoryId = (payee: string) =>
      ({ TESCO: "groceries", DOMINOS: "takeout" })[payee];

    const result = filterTransactions(
      transactions,
      { ...emptyFilters, category: "groceries" },
      getCategoryId,
    );

    expect(result).toEqual([transactions[0]]);
  });

  it("filters to uncategorized payees via the sentinel value", () => {
    const transactions = [
      txn({ payee: "TESCO" }),
      txn({ payee: "DOMINOS" }),
      txn({ payee: "NETFLIX" }),
    ];
    const getCategoryId = (payee: string) =>
      ({ TESCO: "groceries", DOMINOS: "takeout" })[payee];

    const result = filterTransactions(
      transactions,
      { ...emptyFilters, category: UNCATEGORIZED_FILTER_VALUE },
      getCategoryId,
    );

    expect(result).toEqual([transactions[2]]);
  });

  it("treats every transaction as uncategorized when no getCategoryId resolver is given", () => {
    const transactions = [txn({ payee: "TESCO" }), txn({ payee: "DOMINOS" })];

    const result = filterTransactions(transactions, {
      ...emptyFilters,
      category: UNCATEGORIZED_FILTER_VALUE,
    });

    expect(result).toEqual(transactions);
  });

  it("combines filters with AND logic", () => {
    const transactions = [
      txn({ payee: "TESCO", date: new Date(2024, 0, 1), debit: 20 }),
      txn({ payee: "TESCO", date: new Date(2024, 5, 1), debit: 20 }),
      txn({ payee: "SUPERMACS", date: new Date(2024, 0, 1), debit: 20 }),
    ];

    const result = filterTransactions(transactions, {
      ...emptyFilters,
      payeeSearch: "tesco",
      dateTo: new Date(2024, 1, 1),
    });

    expect(result).toEqual([transactions[0]]);
  });
});

describe("getDateBounds", () => {
  it("returns null for an empty list", () => {
    expect(getDateBounds([])).toBeNull();
  });

  it("finds the min and max transaction dates", () => {
    const transactions = [
      txn({ date: new Date(2024, 2, 15) }),
      txn({ date: new Date(2024, 0, 1) }),
      txn({ date: new Date(2024, 5, 30) }),
    ];

    expect(getDateBounds(transactions)).toEqual({
      min: new Date(2024, 0, 1),
      max: new Date(2024, 5, 30),
    });
  });
});

describe("getDatePresets", () => {
  it("anchors relative ranges to the given max date, not real-world today", () => {
    const maxDate = new Date(2024, 5, 15);
    const presets = getDatePresets(maxDate);

    const last3 = presets.find((p) => p.label === "Last 3 months")!.range();
    expect(last3.from).toEqual(new Date(2024, 2, 15));
    expect(last3.to).toEqual(maxDate);

    const allTime = presets.find((p) => p.label === "All time")!.range();
    expect(allTime).toEqual({ from: null, to: null });
  });
});

describe("getAvailableBanks", () => {
  it("returns distinct, sorted bank labels present in the dataset", () => {
    const transactions = [
      txn({ source: "Revolut" }),
      txn({ source: "AIB" }),
      txn({ source: "AIB" }),
    ];

    expect(getAvailableBanks(transactions)).toEqual(["AIB", "Revolut"]);
  });

  it("ignores transactions with no source", () => {
    const transactions = [txn({ source: undefined }), txn({ source: "AIB" })];

    expect(getAvailableBanks(transactions)).toEqual(["AIB"]);
  });

  it("returns an empty array for no transactions", () => {
    expect(getAvailableBanks([])).toEqual([]);
  });
});
