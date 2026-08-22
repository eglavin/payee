"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildTransactionsText, transactionsExportFileName } from "@/lib/export-transactions";
import type { Transaction } from "@/lib/types";

interface SelectedTransactionsDialogProps {
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
}

export function SelectedTransactionsDialog({
  transactions,
  open,
  onOpenChange,
  currency,
}: SelectedTransactionsDialogProps) {
  function handleDownload() {
    const blob = new Blob([buildTransactionsText(transactions)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = transactionsExportFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selected transactions</DialogTitle>
          <DialogDescription>
            <span className="font-mono tabular-nums">{transactions.length}</span> transaction
            {transactions.length === 1 ? "" : "s"} selected
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(txn.date)}
                  </TableCell>
                  <TableCell className="font-medium">{txn.payee}</TableCell>
                  <TableCell className="text-muted-foreground">{txn.detail ?? "—"}</TableCell>
                  <TableCell
                    className={`font-mono text-right tabular-nums whitespace-nowrap ${
                      txn.debit > 0
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {txn.debit > 0
                      ? `-${formatCurrency(txn.debit, currency)}`
                      : `+${formatCurrency(txn.credit, currency)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter showCloseButton>
          <Button type="button" onClick={handleDownload}>
            Download .txt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
