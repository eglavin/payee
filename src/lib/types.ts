export interface Transaction {
  /** Stable identifier, unique within the currently loaded dataset (see `loaded-files.ts`). */
  id: number;
  date: Date;
  /** Raw payee/merchant name as it appears in the source export. */
  payee: string;
  /** Optional secondary detail line (e.g. a reference, or the source format's transaction type). */
  detail?: string;
  /** Which bank format this was parsed from (e.g. "AIB", "Revolut"); assigned when merging loaded files (see `src/lib/loaded-files.ts`). */
  source?: string;
  debit: number;
  credit: number;
  balance: number | null;
  currency: string;
}

export interface PayeeSummary {
  payee: string;
  totalDebit: number;
  totalCredit: number;
  net: number;
  count: number;
  currency: string;
  transactions: Transaction[];
  /** Distinct raw payee values merged into this payee (only >1 under fuzzy matching). */
  variants: string[];
}

export interface MonthlyTotal {
  month: string;
  debit: number;
  credit: number;
  net: number;
}
