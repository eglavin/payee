import { max as latestOf, min as earliestOf, startOfYear, subMonths } from "date-fns";
import type { Transaction } from "./types";

export interface TransactionFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  payeeSearch: string;
  minAmount: number | null;
  maxAmount: number | null;
  bank: string | null;
  /** A category id, `UNCATEGORIZED_FILTER_VALUE`, or null for "all categories". */
  category: string | null;
}

export const emptyFilters: TransactionFilters = {
  dateFrom: null,
  dateTo: null,
  payeeSearch: "",
  minAmount: null,
  maxAmount: null,
  bank: null,
  category: null,
};

/** Sentinel `category` filter value matching payees with no category assigned. */
export const UNCATEGORIZED_FILTER_VALUE = "__uncategorized__";

export function hasActiveFilters(filters: TransactionFilters): boolean {
  return (
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.payeeSearch.trim() !== "" ||
    filters.minAmount !== null ||
    filters.maxAmount !== null ||
    filters.bank !== null ||
    filters.category !== null
  );
}

/** Distinct bank/source labels present in the dataset, for the bank filter's dynamic options. */
export function getAvailableBanks(transactions: Transaction[]): string[] {
  const banks = new Set<string>();
  for (const txn of transactions) {
    if (txn.source) banks.add(txn.source);
  }
  return Array.from(banks).sort();
}

function transactionAmount(txn: Transaction): number {
  return Math.max(txn.debit, txn.credit);
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
  /** Resolves a raw payee string to its assigned category id, if any. Required to use `filters.category`. */
  getCategoryId?: (payee: string) => string | undefined,
): Transaction[] {
  if (!hasActiveFilters(filters)) return transactions;

  const search = filters.payeeSearch.trim().toLowerCase();

  return transactions.filter((txn) => {
    if (filters.dateFrom && txn.date < filters.dateFrom) return false;
    if (filters.dateTo && txn.date > filters.dateTo) return false;
    if (search && !txn.payee.toLowerCase().includes(search)) return false;
    if (filters.bank && txn.source !== filters.bank) return false;

    if (filters.category) {
      const categoryId = getCategoryId?.(txn.payee);
      if (filters.category === UNCATEGORIZED_FILTER_VALUE) {
        if (categoryId !== undefined) return false;
      } else if (categoryId !== filters.category) {
        return false;
      }
    }

    const amount = transactionAmount(txn);
    if (filters.minAmount !== null && amount < filters.minAmount) return false;
    if (filters.maxAmount !== null && amount > filters.maxAmount) return false;

    return true;
  });
}

export interface DateBounds {
  min: Date;
  max: Date;
}

export function getDateBounds(transactions: Transaction[]): DateBounds | null {
  if (transactions.length === 0) return null;

  const dates = transactions.map((t) => t.date);
  return { min: earliestOf(dates), max: latestOf(dates) };
}

export interface DatePreset {
  label: string;
  range: () => { from: Date | null; to: Date | null };
}

/** Presets anchor to the dataset's most recent transaction date, not real-world "today". */
export function getDatePresets(maxDate: Date): DatePreset[] {
  return [
    { label: "Last 3 months", range: () => ({ from: subMonths(maxDate, 3), to: maxDate }) },
    { label: "Last 6 months", range: () => ({ from: subMonths(maxDate, 6), to: maxDate }) },
    { label: "Last 12 months", range: () => ({ from: subMonths(maxDate, 12), to: maxDate }) },
    {
      label: "This year",
      range: () => ({ from: startOfYear(maxDate), to: maxDate }),
    },
    { label: "All time", range: () => ({ from: null, to: null }) },
  ];
}
