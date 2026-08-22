import { describe, expect, it } from "vitest";
import { parseTransactions } from "./formats";
import { SAMPLE_TRANSACTIONS_CSV } from "./sample-data";

describe("SAMPLE_TRANSACTIONS_CSV", () => {
  it("parses cleanly as an AIB export with no skipped rows", () => {
    const { transactions, skippedRows, formatLabel } = parseTransactions(
      SAMPLE_TRANSACTIONS_CSV,
    );

    expect(formatLabel).toBe("AIB");
    expect(skippedRows).toBe(0);
    expect(transactions.length).toBeGreaterThan(0);
  });

  it("has exactly 10 distinct payees, each with more than one transaction", () => {
    const { transactions } = parseTransactions(SAMPLE_TRANSACTIONS_CSV);

    const countByPayee = new Map<string, number>();
    for (const txn of transactions) {
      countByPayee.set(txn.payee, (countByPayee.get(txn.payee) ?? 0) + 1);
    }

    expect(countByPayee.size).toBe(10);
    for (const count of countByPayee.values()) {
      expect(count).toBeGreaterThan(1);
    }
  });

  it("includes both spending and income transactions", () => {
    const { transactions } = parseTransactions(SAMPLE_TRANSACTIONS_CSV);

    expect(transactions.some((t) => t.debit > 0)).toBe(true);
    expect(transactions.some((t) => t.credit > 0)).toBe(true);
  });
});
