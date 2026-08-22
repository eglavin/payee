import { describe, expect, it } from "vitest";
import { groupByPayee, monthlyTrend, topPayeesBySpend } from "./aggregate";
import { makeTransaction as txn } from "./test-fixtures";

describe("groupByPayee", () => {
  it("aggregates totals and count per payee", () => {
    const transactions = [
      txn({ payee: "TESCO", debit: 20 }),
      txn({ payee: "TESCO", debit: 30 }),
      txn({ payee: "SALARY", credit: 2000 }),
    ];

    const summaries = groupByPayee(transactions);
    const tesco = summaries.find((s) => s.payee === "TESCO");
    const salary = summaries.find((s) => s.payee === "SALARY");

    expect(tesco).toMatchObject({ totalDebit: 50, totalCredit: 0, count: 2 });
    expect(salary).toMatchObject({
      totalDebit: 0,
      totalCredit: 2000,
      count: 1,
      net: 2000,
    });
  });
});

describe("topPayeesBySpend", () => {
  it("returns the top N payees sorted by total debit, excluding pure-income payees", () => {
    const transactions = [
      txn({ payee: "A", debit: 100 }),
      txn({ payee: "B", debit: 300 }),
      txn({ payee: "C", debit: 200 }),
      txn({ payee: "SALARY", credit: 5000 }),
    ];

    const top = topPayeesBySpend(groupByPayee(transactions), 2);

    expect(top.map((s) => s.payee)).toEqual(["B", "C"]);
  });
});

describe("monthlyTrend", () => {
  it("buckets totals by month across years", () => {
    const transactions = [
      txn({ date: new Date(2024, 0, 5), debit: 10 }),
      txn({ date: new Date(2024, 0, 20), debit: 5 }),
      txn({ date: new Date(2024, 1, 1), credit: 100 }),
    ];

    const trend = monthlyTrend(transactions);

    expect(trend).toEqual([
      { month: "2024-01", debit: 15, credit: 0, net: -15 },
      { month: "2024-02", debit: 0, credit: 100, net: 100 },
    ]);
  });

  it("filters to a single payee when provided", () => {
    const transactions = [
      txn({ payee: "TESCO", date: new Date(2024, 0, 5), debit: 10 }),
      txn({ payee: "SALARY", date: new Date(2024, 0, 5), credit: 100 }),
    ];

    const trend = monthlyTrend(transactions, "TESCO");

    expect(trend).toEqual([{ month: "2024-01", debit: 10, credit: 0, net: -10 }]);
  });
});
