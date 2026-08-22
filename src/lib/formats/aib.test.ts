import { describe, expect, it } from "vitest";
import { aibFormat } from "./aib";

const HEADER =
  "Posted Account,Posted Transactions Date,Description1,Description2,Description3,Debit Amount,Credit Amount,Balance,Posted Currency,Transaction Type,Local Currency Amount,Local Currency";

describe("aibFormat.matchesHeader", () => {
  it("matches the exact AIB header line", () => {
    expect(aibFormat.matchesHeader(HEADER)).toBe(true);
  });

  it("does not match an unrelated header", () => {
    expect(aibFormat.matchesHeader("Type,Product,Amount")).toBe(false);
  });
});

describe("aibFormat.parse", () => {
  it("parses debit and credit rows, treating the blank side as 0", () => {
    const csv = [
      HEADER,
      "12345678,21/03/2024,TESCO STORES,,,45.20,,1000.00,EUR,POS,,",
      "12345678,22/03/2024,SALARY,,,,2500.00,3500.00,EUR,CREDIT,,",
    ].join("\n");

    const { transactions } = aibFormat.parse(csv);

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      payee: "TESCO STORES",
      debit: 45.2,
      credit: 0,
    });
    expect(transactions[1]).toMatchObject({
      payee: "SALARY",
      debit: 0,
      credit: 2500,
    });
  });

  it("strips thousands-separator commas from amounts", () => {
    const csv = [
      HEADER,
      '12345678,01/01/2024,BIG PURCHASE,,,"1,234.56",,,"EUR",POS,,',
    ].join("\n");

    const { transactions } = aibFormat.parse(csv);

    expect(transactions[0].debit).toBe(1234.56);
  });

  it("parses AIB's DD/MM/YYYY date format", () => {
    const csv = [HEADER, "12345678,05/12/2024,PAYEE,,,10.00,,,EUR,POS,,"].join(
      "\n",
    );

    const { transactions } = aibFormat.parse(csv);

    expect(transactions[0].date.getFullYear()).toBe(2024);
    expect(transactions[0].date.getMonth()).toBe(11); // December
    expect(transactions[0].date.getDate()).toBe(5);
  });

  it("skips blank trailing rows", () => {
    const csv = [
      HEADER,
      "12345678,01/01/2024,PAYEE,,,10.00,,,EUR,POS,,",
      ",,,,,,,,,,,",
      "",
    ].join("\n");

    const { transactions, skippedRows } = aibFormat.parse(csv);

    expect(transactions).toHaveLength(1);
    expect(skippedRows).toBe(0);
  });

  it("trims whitespace from the payee name", () => {
    const csv = [
      HEADER,
      "12345678,01/01/2024,  TESCO STORES  ,,,10.00,,,EUR,POS,,",
    ].join("\n");

    const { transactions } = aibFormat.parse(csv);

    expect(transactions[0].payee).toBe("TESCO STORES");
  });

  it("joins Description2 and Description3 into a single detail field", () => {
    const csv = [
      HEADER,
      "12345678,01/01/2024,TESCO STORES,REF1,STORE 4,10.00,,,EUR,POS,,",
    ].join("\n");

    const { transactions } = aibFormat.parse(csv);

    expect(transactions[0].detail).toBe("REF1 · STORE 4");
  });

  it("leaves detail undefined when Description2/3 are blank", () => {
    const csv = [
      HEADER,
      "12345678,01/01/2024,TESCO STORES,,,10.00,,,EUR,POS,,",
    ].join("\n");

    const { transactions } = aibFormat.parse(csv);

    expect(transactions[0].detail).toBeUndefined();
  });
});
