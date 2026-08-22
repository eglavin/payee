"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

type SortKey = "date" | "payee" | "amount";

interface TransactionsTableProps {
  transactions: Transaction[];
  currency: string;
  resolvePayee: (txn: Transaction) => string;
  onSelectPayee: (payee: string) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
}

export function TransactionsTable({
  transactions,
  currency,
  resolvePayee,
  onSelectPayee,
  selectedIds,
  onSelectionChange,
}: TransactionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...transactions];
    copy.sort((a, b) => {
      let diff: number;
      if (sortKey === "date") {
        diff = a.date.getTime() - b.date.getTime();
      } else if (sortKey === "amount") {
        diff = a.credit - a.debit - (b.credit - b.debit);
      } else {
        diff = resolvePayee(a).localeCompare(resolvePayee(b));
      }
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [transactions, sortKey, sortDir, resolvePayee]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "payee" ? "asc" : "desc");
    }
  }

  function renderSortHeader(label: string, key: SortKey, align: "left" | "right" = "left") {
    const active = sortKey === key;
    return (
      <TableHead
        role="button"
        onClick={() => toggleSort(key)}
        className={`cursor-pointer select-none ${align === "right" ? "text-right" : ""}`}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active &&
            (sortDir === "asc" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            ))}
        </span>
      </TableHead>
    );
  }

  function toggleRow(id: number, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onSelectionChange(next);
  }

  const allSelected = sorted.length > 0 && sorted.every((t) => selectedIds.has(t.id));
  const someSelected = sorted.some((t) => selectedIds.has(t.id));

  function toggleAll(checked: boolean) {
    const next = new Set(selectedIds);
    for (const t of sorted) {
      if (checked) {
        next.add(t.id);
      } else {
        next.delete(t.id);
      }
    }
    onSelectionChange(next);
  }

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No transactions to show.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onCheckedChange={(checked) => toggleAll(checked === true)}
              aria-label="Select all transactions"
            />
          </TableHead>
          {renderSortHeader("Date", "date")}
          {renderSortHeader("Payee", "payee")}
          <TableHead>Details</TableHead>
          <TableHead>Bank</TableHead>
          {renderSortHeader("Amount", "amount", "right")}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((txn) => {
          const payee = resolvePayee(txn);
          return (
            <TableRow
              key={txn.id}
              className="cursor-pointer"
              onClick={() => onSelectPayee(payee)}
              data-state={selectedIds.has(txn.id) ? "selected" : undefined}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(txn.id)}
                  onCheckedChange={(checked) => toggleRow(txn.id, checked === true)}
                  aria-label={`Select transaction on ${formatDate(txn.date)} for ${payee}`}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(txn.date)}</TableCell>
              <TableCell className="font-medium">{payee}</TableCell>
              <TableCell className="text-muted-foreground">{txn.detail ?? "—"}</TableCell>
              <TableCell>
                {txn.source ? (
                  <Badge variant="secondary" className="font-normal">
                    {txn.source}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
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
          );
        })}
      </TableBody>
    </Table>
  );
}
