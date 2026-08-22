import { describe, expect, it } from "vitest";
import { parseTransactions } from "./index";

const AIB_HEADER =
  "Posted Account,Posted Transactions Date,Description1,Description2,Description3,Debit Amount,Credit Amount,Balance,Posted Currency,Transaction Type,Local Currency Amount,Local Currency";

const REVOLUT_HEADER =
  "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance";

describe("parseTransactions", () => {
  it("selects the AIB format for an AIB header", () => {
    const csv = [
      AIB_HEADER,
      "12345678,01/01/2024,TESCO STORES,,,10.00,,,EUR,POS,,",
    ].join("\n");

    const result = parseTransactions(csv);

    expect(result.formatLabel).toBe("AIB");
    expect(result.transactions).toHaveLength(1);
  });

  it("selects the Revolut format for a Revolut header", () => {
    const csv = [
      REVOLUT_HEADER,
      "Card Payment,Current,2026-01-01 09:00:00,2026-01-01 09:00:00,Shop,-1,0,EUR,COMPLETED,10",
    ].join("\n");

    const result = parseTransactions(csv);

    expect(result.formatLabel).toBe("Revolut");
    expect(result.transactions).toHaveLength(1);
  });

  it("throws a clear error naming supported formats when the header is unrecognized", () => {
    expect(() => parseTransactions("Foo,Bar,Baz\n1,2,3")).toThrow(/AIB.*Revolut|Revolut.*AIB/);
  });
});
