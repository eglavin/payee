import { describe, expect, it } from "vitest";
import { revolutFormat } from "./revolut";

const HEADER =
  "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance";

describe("revolutFormat.matchesHeader", () => {
  it("matches the exact Revolut header line", () => {
    expect(revolutFormat.matchesHeader(HEADER)).toBe(true);
  });

  it("does not match an unrelated header", () => {
    expect(revolutFormat.matchesHeader("Posted Account,Description1")).toBe(false);
  });
});

describe("revolutFormat.parse", () => {
  it("splits a negative amount into debit, positive amount into credit", () => {
    const csv = [
      HEADER,
      "Card Payment,Current,2026-01-05 12:57:00,2026-01-06 10:49:00,Daybreak,-5,0,EUR,COMPLETED,168.8",
      "Transfer,Current,2026-01-06 17:48:00,2026-01-06 17:48:00,Transfer from BERNADETTE EUCHARIA GLAVIN,60,0,EUR,COMPLETED,228.8",
    ].join("\n");

    const { transactions } = revolutFormat.parse(csv);

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({ payee: "Daybreak", debit: 5, credit: 0 });
    expect(transactions[1]).toMatchObject({
      payee: "Transfer from BERNADETTE EUCHARIA GLAVIN",
      debit: 0,
      credit: 60,
    });
  });

  it("folds a fee into the debit side, even on top of a negative amount", () => {
    const csv = [
      HEADER,
      "Card Payment,Current,2026-01-05 12:57:00,2026-01-06 10:49:00,Shop,-10,1.5,EUR,COMPLETED,100",
    ].join("\n");

    const { transactions } = revolutFormat.parse(csv);

    expect(transactions[0].debit).toBeCloseTo(11.5);
    expect(transactions[0].credit).toBe(0);
  });

  it("folds a fee into debit on top of a positive (credit) amount", () => {
    const csv = [
      HEADER,
      "Exchange,Current,2026-01-05 12:57:00,2026-01-06 10:49:00,Exchanged to EUR,50,0.5,EUR,COMPLETED,100",
    ].join("\n");

    const { transactions } = revolutFormat.parse(csv);

    expect(transactions[0].credit).toBe(50);
    expect(transactions[0].debit).toBeCloseTo(0.5);
  });

  it("prefers Completed Date over Started Date", () => {
    const csv = [
      HEADER,
      "Card Payment,Current,2026-01-01 09:00:00,2026-01-05 09:00:00,Shop,-1,0,EUR,COMPLETED,10",
    ].join("\n");

    const { transactions } = revolutFormat.parse(csv);

    expect(transactions[0].date.getDate()).toBe(5);
  });

  it("falls back to Started Date when Completed Date is blank (e.g. a pending row)", () => {
    const csv = [
      HEADER,
      "Card Payment,Current,2026-01-02 09:00:00,,Shop,-1,0,EUR,PENDING,10",
    ].join("\n");

    const { transactions } = revolutFormat.parse(csv);

    expect(transactions[0].date.getDate()).toBe(2);
  });

  it("imports rows regardless of State", () => {
    const csv = [
      HEADER,
      "Card Payment,Current,2026-01-01 09:00:00,2026-01-01 09:00:00,Shop,-1,0,EUR,REVERTED,10",
    ].join("\n");

    const { transactions, skippedRows } = revolutFormat.parse(csv);

    expect(transactions).toHaveLength(1);
    expect(skippedRows).toBe(0);
  });

  it("uses the Type column as the detail field", () => {
    const csv = [
      HEADER,
      "Card Payment,Current,2026-01-01 09:00:00,2026-01-01 09:00:00,Shop,-1,0,EUR,COMPLETED,10",
    ].join("\n");

    const { transactions } = revolutFormat.parse(csv);

    expect(transactions[0].detail).toBe("Card Payment");
  });

  it("skips rows with a blank description or unparseable dates", () => {
    const csv = [
      HEADER,
      "Card Payment,Current,,,,-1,0,EUR,COMPLETED,10",
      ",,,,,,,,,",
      "",
    ].join("\n");

    const { transactions, skippedRows } = revolutFormat.parse(csv);

    expect(transactions).toHaveLength(0);
    expect(skippedRows).toBe(1);
  });
});
