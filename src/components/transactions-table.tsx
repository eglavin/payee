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
import { CategoryPicker } from "@/components/category-picker";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category } from "@/lib/categories";
import type { Transaction } from "@/lib/types";
import { useVirtualTableRows } from "@/hooks/use-virtual-table-rows";

const COLUMN_COUNT = 7;

type SortKey = "date" | "payee" | "amount";

interface TransactionsTableProps {
  transactions: Transaction[];
  currency: string;
  resolvePayee: (txn: Transaction) => string;
  onSelectPayee: (payee: string) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  categories: Category[];
  getCategoryId: (payee: string) => string | undefined;
  setCategoryId: (payee: string, categoryId: string | null) => void;
  onAddCategory: (label: string) => Category;
}

export function TransactionsTable({
  transactions,
  currency,
  resolvePayee,
  onSelectPayee,
  selectedIds,
  onSelectionChange,
  categories,
  getCategoryId,
  setCategoryId,
  onAddCategory,
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
        tabIndex={0}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
        onClick={() => toggleSort(key)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSort(key);
          }
        }}
        className={`sticky top-0 z-10 cursor-pointer bg-card select-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${align === "right" ? "text-right" : ""}`}
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

  const { containerRef, virtualItems, paddingTop, paddingBottom, measureElement } =
    useVirtualTableRows({ count: sorted.length, estimateRowHeight: 37 });

  if (sorted.length === 0) {
    return (
      <p className="flex h-[70vh] items-center justify-center text-center text-sm text-muted-foreground">
        No transactions to show.
      </p>
    );
  }

  return (
    <Table
      containerClassName="h-[70vh] overflow-y-auto rounded-md border"
      containerRef={containerRef}
      aria-rowcount={sorted.length + 1}
    >
      <TableHeader>
        <TableRow aria-rowindex={1}>
          <TableHead className="sticky top-0 z-10 w-10 bg-card">
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onCheckedChange={(checked) => toggleAll(checked === true)}
              aria-label="Select all transactions"
            />
          </TableHead>
          {renderSortHeader("Date", "date")}
          {renderSortHeader("Payee", "payee")}
          <TableHead className="sticky top-0 z-10 bg-card">Category</TableHead>
          <TableHead className="sticky top-0 z-10 bg-card">Details</TableHead>
          <TableHead className="sticky top-0 z-10 bg-card">Bank</TableHead>
          {renderSortHeader("Amount", "amount", "right")}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paddingTop > 0 && (
          <tr>
            <td style={{ height: paddingTop }} colSpan={COLUMN_COUNT} />
          </tr>
        )}
        {virtualItems.map((virtualRow) => {
          const txn = sorted[virtualRow.index];
          const payee = resolvePayee(txn);
          return (
            <TableRow
              key={txn.id}
              data-index={virtualRow.index}
              ref={measureElement}
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:-ring-offset-1 focus-visible:ring-ring/50"
              tabIndex={0}
              aria-label={`View details for ${payee}`}
              aria-rowindex={virtualRow.index + 2}
              onClick={() => onSelectPayee(payee)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPayee(payee);
                }
              }}
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
              <TableCell onClick={(e) => e.stopPropagation()}>
                <CategoryPicker
                  size="sm"
                  categories={categories}
                  categoryId={getCategoryId(payee)}
                  onCategoryChange={(categoryId) => setCategoryId(payee, categoryId)}
                  onAddCategory={onAddCategory}
                />
              </TableCell>
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
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {txn.debit > 0
                  ? `-${formatCurrency(txn.debit, currency)}`
                  : `+${formatCurrency(txn.credit, currency)}`}
              </TableCell>
            </TableRow>
          );
        })}
        {paddingBottom > 0 && (
          <tr>
            <td style={{ height: paddingBottom }} colSpan={COLUMN_COUNT} />
          </tr>
        )}
      </TableBody>
    </Table>
  );
}
