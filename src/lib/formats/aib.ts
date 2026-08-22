import { isValid, parse as parseDate } from "date-fns";
import Papa from "papaparse";
import type { Transaction } from "../types";
import { isBlankRow, matchesExactHeader, parseAmount, parseNullableAmount } from "./csv-utils";
import type { BankFormat, ParseResult } from "./types";

const HEADER =
  "Posted Account,Posted Transactions Date,Description1,Description2,Description3,Debit Amount,Credit Amount,Balance,Posted Currency,Transaction Type,Local Currency Amount,Local Currency";

interface RawRow {
  "Posted Account"?: string;
  "Posted Transactions Date"?: string;
  Description1?: string;
  Description2?: string;
  Description3?: string;
  "Debit Amount"?: string;
  "Credit Amount"?: string;
  Balance?: string;
  "Posted Currency"?: string;
  "Transaction Type"?: string;
  "Local Currency Amount"?: string;
  "Local Currency"?: string;
}

/** AIB dates are "D/M/YYYY" (day and month not zero-padded). */
function parseAibDate(value: string | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = parseDate(trimmed, "d/M/yyyy", new Date());
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

    const payee = (row.Description1 ?? "").trim();
    const date = parseAibDate(row["Posted Transactions Date"]);

    if (!payee || !date) {
      skippedRows++;
      continue;
    }

    const detail = [row.Description2, row.Description3]
      .map((v) => (v ?? "").trim())
      .filter(Boolean)
      .join(" · ");

    transactions.push({
      id: transactions.length,
      date,
      payee,
      detail: detail || undefined,
      debit: parseAmount(row["Debit Amount"]),
      credit: parseAmount(row["Credit Amount"]),
      balance: parseNullableAmount(row.Balance),
      currency: (row["Posted Currency"] ?? "EUR").trim(),
    });
  }

  return { transactions, skippedRows };
}

export const aibFormat: BankFormat = {
  id: "aib",
  label: "AIB",
  matchesHeader: matchesExactHeader(HEADER),
  parse,
};
