import type { Transaction } from "../types";

export interface ParseResult {
  transactions: Transaction[];
  skippedRows: number;
}

export interface BankFormat {
  id: string;
  label: string;
  /** Given the CSV's first line, decide whether this format's columns match. */
  matchesHeader(headerLine: string): boolean;
  parse(csvText: string): ParseResult;
}
