import { describe, expect, it } from "vitest";
import { prepareTransactions, detectCurrencies } from "./loaded-files";
import { makeTransaction as txn } from "./test-fixtures";

describe("prepareTransactions", () => {
  it("offsets ids sequentially starting at startId", () => {
    const transactions = [txn({ id: 0 }), txn({ id: 1 }), txn({ id: 2 })];

    const result = prepareTransactions(transactions, 10, "AIB");

    expect(result.map((t) => t.id)).toEqual([10, 11, 12]);
  });

  it("stamps every transaction with the given source", () => {
    const transactions = [txn({}), txn({})];

    const result = prepareTransactions(transactions, 0, "Revolut");

    expect(result.every((t) => t.source === "Revolut")).toBe(true);
  });

  it("does not mutate the input array or its transactions", () => {
    const original = [txn({ id: 0, payee: "A" })];

    const result = prepareTransactions(original, 5, "AIB");

    expect(original[0].id).toBe(0);
    expect(original[0].source).toBeUndefined();
    expect(result[0].id).toBe(5);
    expect(result[0]).not.toBe(original[0]);
    expect(result[0].payee).toBe("A");
  });

  it("returns an empty array unchanged", () => {
    expect(prepareTransactions([], 3, "AIB")).toEqual([]);
  });

  it("strips known noise prefixes from the payee unconditionally", () => {
    const transactions = [
      txn({ payee: "VDC-Tesco Stores" }),
      txn({ payee: "Transfer from Jane Doe" }),
    ];

    const result = prepareTransactions(transactions, 0, "AIB");

    expect(result.map((t) => t.payee)).toEqual(["Tesco Stores", "Jane Doe"]);
  });

  it("leaves a payee with no known prefix unchanged", () => {
    const result = prepareTransactions([txn({ payee: "Tesco Stores" })], 0, "AIB");
    expect(result[0].payee).toBe("Tesco Stores");
  });
});

describe("detectCurrencies", () => {
  it("returns a single currency when all transactions agree", () => {
    const transactions = [txn({ currency: "EUR" }), txn({ currency: "EUR" })];
    expect(detectCurrencies(transactions)).toEqual(["EUR"]);
  });

  it("returns each distinct currency when transactions disagree", () => {
    const transactions = [txn({ currency: "EUR" }), txn({ currency: "GBP" })];
    expect(detectCurrencies(transactions)).toEqual(["EUR", "GBP"]);
  });

  it("returns an empty array for no transactions", () => {
    expect(detectCurrencies([])).toEqual([]);
  });
});
