import { stripKnownPrefixes } from "./payee-prefixes";
import type { Transaction } from "./types";

export interface LoadedFile {
  /** Generated per upload; used for the remove-file action. */
  id: string;
  name: string;
  formatLabel: string;
  skippedRows: number;
  transactions: Transaction[];
}

/**
 * Prepares a freshly-parsed file's transactions for merging: reassigns
 * sequential ids from `startId` (each file's parser ids independently from
 * 0), stamps `source`, and strips known noise prefixes from the payee.
 */
export function prepareTransactions(
  transactions: Transaction[],
  startId: number,
  source: string,
): Transaction[] {
  return transactions.map((txn, i) => ({
    ...txn,
    id: startId + i,
    source,
    payee: stripKnownPrefixes(txn.payee),
  }));
}

/** Distinct currencies across a transaction pool, for the mixed-currency warning. */
export function detectCurrencies(transactions: Transaction[]): string[] {
  return Array.from(new Set(transactions.map((t) => t.currency)));
}
