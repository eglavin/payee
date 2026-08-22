import { format } from "date-fns";
import { clusterPayeeKeys, DEFAULT_FUZZY_THRESHOLD, normalizePayeeKey } from "./fuzzy-match";
import type { MonthlyTotal, PayeeSummary, Transaction } from "./types";

function buildSummaries(
  transactions: Transaction[],
  keyOf: (txn: Transaction) => string,
): PayeeSummary[] {
  const byKey = new Map<string, PayeeSummary>();

  for (const txn of transactions) {
    const key = keyOf(txn);
    const existing = byKey.get(key);
    if (existing) {
      existing.totalDebit += txn.debit;
      existing.totalCredit += txn.credit;
      existing.net += txn.credit - txn.debit;
      existing.count += 1;
      existing.transactions.push(txn);
      if (!existing.variants.includes(txn.payee)) {
        existing.variants.push(txn.payee);
      }
    } else {
      byKey.set(key, {
        payee: key,
        totalDebit: txn.debit,
        totalCredit: txn.credit,
        net: txn.credit - txn.debit,
        count: 1,
        currency: txn.currency,
        transactions: [txn],
        variants: [txn.payee],
      });
    }
  }

  return Array.from(byKey.values());
}

export function groupByPayee(transactions: Transaction[]): PayeeSummary[] {
  return buildSummaries(transactions, (txn) => txn.payee);
}

/**
 * Like groupByPayee, but first collapses near-duplicate merchant strings
 * (case/whitespace noise, trailing store numbers) via fuzzy clustering.
 */
export function groupByPayeeFuzzy(
  transactions: Transaction[],
  threshold: number = DEFAULT_FUZZY_THRESHOLD,
): PayeeSummary[] {
  const normalizedKeyOf = new Map<string, string>();
  const countByNormalizedKey = new Map<string, number>();

  for (const txn of transactions) {
    const normalized = normalizePayeeKey(txn.payee);
    normalizedKeyOf.set(txn.payee, normalized);
    countByNormalizedKey.set(
      normalized,
      (countByNormalizedKey.get(normalized) ?? 0) + 1,
    );
  }

  const canonicalByNormalizedKey = clusterPayeeKeys(countByNormalizedKey, threshold);

  return buildSummaries(transactions, (txn) => {
    const normalized = normalizedKeyOf.get(txn.payee)!;
    return canonicalByNormalizedKey.get(normalized) ?? normalized;
  });
}

export function topPayeesBySpend(
  summaries: PayeeSummary[],
  n: number,
): PayeeSummary[] {
  return [...summaries]
    .filter((s) => s.totalDebit > 0)
    .sort((a, b) => b.totalDebit - a.totalDebit)
    .slice(0, n);
}

function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function monthlyTrend(
  transactions: Transaction[],
  payee?: string,
): MonthlyTotal[] {
  const filtered = payee
    ? transactions.filter((t) => t.payee === payee)
    : transactions;

  const byMonth = new Map<string, MonthlyTotal>();

  for (const txn of filtered) {
    const key = monthKey(txn.date);
    const existing = byMonth.get(key);
    if (existing) {
      existing.debit += txn.debit;
      existing.credit += txn.credit;
      existing.net += txn.credit - txn.debit;
    } else {
      byMonth.set(key, {
        month: key,
        debit: txn.debit,
        credit: txn.credit,
        net: txn.credit - txn.debit,
      });
    }
  }

  return Array.from(byMonth.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}
