import { format } from "date-fns";
import { formatCurrency, formatDate } from "./format";
import type { Transaction } from "./types";

export function buildTransactionsText(transactions: Transaction[]): string {
  const lines: string[] = [];
  const count = transactions.length;
  lines.push(`Transaction export — ${count} transaction${count === 1 ? "" : "s"}`);
  lines.push(`Generated: ${new Date().toLocaleString("en-IE")}`);
  lines.push("");

  for (const txn of transactions) {
    lines.push(`${formatDate(txn.date)} — ${txn.payee}`);
    if (txn.detail) lines.push(`  Details: ${txn.detail}`);
    lines.push(
      txn.debit > 0
        ? `  Debit: ${formatCurrency(txn.debit, txn.currency)}`
        : `  Credit: ${formatCurrency(txn.credit, txn.currency)}`,
    );
    if (txn.balance !== null) {
      lines.push(`  Balance: ${formatCurrency(txn.balance, txn.currency)}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function transactionsExportFileName(): string {
  return `transactions-${format(new Date(), "yyyyMMdd-HHmm")}.txt`;
}
