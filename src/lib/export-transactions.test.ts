import { describe, expect, it } from "vitest";
import { buildTransactionsText } from "./export-transactions";
import { makeTransaction as txn } from "./test-fixtures";

describe("buildTransactionsText", () => {
  it("includes a count header and generated timestamp", () => {
    const text = buildTransactionsText([txn({ payee: "TESCO" })]);
    expect(text).toContain("1 transaction");
    expect(text).toContain("Generated:");
  });

  it("pluralizes the count for zero and multiple transactions", () => {
    expect(buildTransactionsText([])).toContain("0 transactions");
    expect(
      buildTransactionsText([txn({}), txn({})]),
    ).toContain("2 transactions");
  });

  it("lists the payee and formatted date for each transaction", () => {
    const text = buildTransactionsText([
      txn({ date: new Date(2024, 2, 21), payee: "TESCO STORES" }),
    ]);
    expect(text).toContain("21 Mar 2024 — TESCO STORES");
  });

  it("shows debit amounts as Debit and credit amounts as Credit", () => {
    const text = buildTransactionsText([
      txn({ payee: "SHOP", debit: 45.2 }),
      txn({ payee: "SALARY", credit: 2500 }),
    ]);
    expect(text).toMatch(/Debit: €45\.20/);
    expect(text).toMatch(/Credit: €2,500\.00/);
  });

  it("includes the detail line only when present", () => {
    const withDetails = buildTransactionsText([
      txn({ payee: "SHOP", detail: "REF123 · STORE 4" }),
    ]);
    expect(withDetails).toContain("Details: REF123 · STORE 4");

    const withoutDetails = buildTransactionsText([txn({ payee: "SHOP" })]);
    expect(withoutDetails).not.toContain("Details:");
  });

  it("includes balance only when present", () => {
    const withBalance = buildTransactionsText([txn({ balance: 1000 })]);
    expect(withBalance).toMatch(/Balance: €1,000\.00/);

    const withoutBalance = buildTransactionsText([txn({ balance: null })]);
    expect(withoutBalance).not.toContain("Balance:");
  });
});
