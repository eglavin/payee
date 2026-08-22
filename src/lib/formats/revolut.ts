import { isValid, parse as parseDate } from "date-fns";
import Papa from "papaparse";
import type { Transaction } from "../types";
import { isBlankRow, matchesExactHeader, parseAmount, parseNullableAmount } from "./csv-utils";
import type { BankFormat, ParseResult } from "./types";

const HEADER =
  "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance";

interface RawRow {
  Type?: string;
  Product?: string;
  "Started Date"?: string;
  "Completed Date"?: string;
  Description?: string;
  Amount?: string;
  Fee?: string;
  Currency?: string;
  State?: string;
  Balance?: string;
}

/** Revolut's raw CSV export uses "YYYY-MM-DD HH:mm:ss"; only the date portion matters here. */
function parseRevolutDate(value: string | undefined): Date | null {
  if (!value) return null;
  const datePart = value.trim().split(" ")[0];
  if (!datePart) return null;
  const date = parseDate(datePart, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : null;
}

function parse(csvText: string): ParseResult {
  const { data } = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const transactions: Transaction[] = [];
  let skippedRows = 0;

  for (const row of data) {
    if (isBlankRow(row)) continue;

    const payee = (row.Description ?? "").trim();
    const date = parseRevolutDate(row["Completed Date"]) ?? parseRevolutDate(row["Started Date"]);

    if (!payee || !date) {
      skippedRows++;
      continue;
    }

    const amount = parseAmount(row.Amount);
    const fee = parseAmount(row.Fee);

    transactions.push({
      id: transactions.length,
      date,
      payee,
      detail: (row.Type ?? "").trim() || undefined,
      debit: amount < 0 ? -amount + fee : fee,
      credit: amount > 0 ? amount : 0,
      balance: parseNullableAmount(row.Balance),
      currency: (row.Currency ?? "EUR").trim(),
    });
  }

  return { transactions, skippedRows };
}

export const revolutFormat: BankFormat = {
  id: "revolut",
  label: "Revolut",
  matchesHeader: matchesExactHeader(HEADER),
  parse,
};
