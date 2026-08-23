"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryPicker } from "@/components/category-picker";
import { formatCurrency } from "@/lib/format";
import type { Category } from "@/lib/categories";
import type { PayeeSummary } from "@/lib/types";
import { useVirtualTableRows } from "@/hooks/use-virtual-table-rows";

type SortKey = "totalDebit" | "totalCredit" | "count" | "merged";

const sortAccessors: Record<SortKey, (summary: PayeeSummary) => number> = {
  totalDebit: (s) => s.totalDebit,
  totalCredit: (s) => s.totalCredit,
  count: (s) => s.count,
  merged: (s) => s.variants.length,
};

interface PayeeTableProps {
  summaries: PayeeSummary[];
  currency: string;
  onSelectPayee: (payee: string) => void;
  categories: Category[];
  getCategoryId: (payee: string) => string | undefined;
  setCategoryId: (payee: string, categoryId: string | null) => void;
  onAddCategory: (label: string) => Category;
  selectedPayees: Set<string>;
  onSelectionChange: (payees: Set<string>) => void;
}

export function PayeeTable({
  summaries,
  currency,
  onSelectPayee,
  categories,
  getCategoryId,
  setCategoryId,
  onAddCategory,
  selectedPayees,
  onSelectionChange,
}: PayeeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalDebit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const hasMerges = summaries.some((s) => s.variants.length > 1);

  const sorted = useMemo(() => {
    const accessor = sortAccessors[sortKey];
    const copy = [...summaries];
    copy.sort((a, b) => {
      const diff = accessor(a) - accessor(b);
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [summaries, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleRow(payee: string, checked: boolean) {
    const next = new Set(selectedPayees);
    if (checked) {
      next.add(payee);
    } else {
      next.delete(payee);
    }
    onSelectionChange(next);
  }

  const allSelected = sorted.length > 0 && sorted.every((s) => selectedPayees.has(s.payee));
  const someSelected = sorted.some((s) => selectedPayees.has(s.payee));

  function toggleAll(checked: boolean) {
    const next = new Set(selectedPayees);
    for (const s of sorted) {
      if (checked) {
        next.add(s.payee);
      } else {
        next.delete(s.payee);
      }
    }
    onSelectionChange(next);
  }

  function renderSortHeader(label: string, sortKeyValue: SortKey) {
    const active = sortKey === sortKeyValue;
    return (
      <TableHead
        role="button"
        onClick={() => toggleSort(sortKeyValue)}
        className="sticky top-0 z-10 cursor-pointer bg-card text-right select-none"
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

  const columnCount = hasMerges ? 7 : 6;
  const { containerRef, virtualItems, paddingTop, paddingBottom, measureElement } =
    useVirtualTableRows({ count: sorted.length, estimateRowHeight: 37 });

  if (summaries.length === 0) {
    return (
      <p className="flex h-[70vh] items-center justify-center text-center text-sm text-muted-foreground">
        No payees to show.
      </p>
    );
  }

  return (
    <Table
      containerClassName="h-[70vh] overflow-y-auto rounded-md border"
      containerRef={containerRef}
    >
      <TableHeader>
        <TableRow>
          <TableHead className="sticky top-0 z-10 w-10 bg-card">
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onCheckedChange={(checked) => toggleAll(checked === true)}
              aria-label="Select all payees"
            />
          </TableHead>
          <TableHead className="sticky top-0 z-10 bg-card">Payee</TableHead>
          <TableHead className="sticky top-0 z-10 bg-card">Category</TableHead>
          {renderSortHeader("Spent", "totalDebit")}
          {renderSortHeader("Received", "totalCredit")}
          {renderSortHeader("Transactions", "count")}
          {hasMerges && renderSortHeader("Merged", "merged")}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paddingTop > 0 && (
          <tr>
            <td style={{ height: paddingTop }} colSpan={columnCount} />
          </tr>
        )}
        {virtualItems.map((virtualRow) => {
          const summary = sorted[virtualRow.index];
          return (
            <TableRow
              key={summary.payee}
              data-index={virtualRow.index}
              ref={measureElement}
              className="cursor-pointer"
              onClick={() => onSelectPayee(summary.payee)}
              data-state={selectedPayees.has(summary.payee) ? "selected" : undefined}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedPayees.has(summary.payee)}
                  onCheckedChange={(checked) => toggleRow(summary.payee, checked === true)}
                  aria-label={`Select ${summary.payee}`}
                />
              </TableCell>
              <TableCell className="font-medium">{summary.payee}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <CategoryPicker
                  size="sm"
                  categories={categories}
                  categoryId={getCategoryId(summary.payee)}
                  onCategoryChange={(categoryId) => setCategoryId(summary.payee, categoryId)}
                  onAddCategory={onAddCategory}
                />
              </TableCell>
              <TableCell className="font-mono text-right tabular-nums">
                {summary.totalDebit > 0
                  ? formatCurrency(summary.totalDebit, currency)
                  : "—"}
              </TableCell>
              <TableCell className="font-mono text-right tabular-nums">
                {summary.totalCredit > 0
                  ? formatCurrency(summary.totalCredit, currency)
                  : "—"}
              </TableCell>
              <TableCell className="font-mono text-right tabular-nums">{summary.count}</TableCell>
              {hasMerges && (
                <TableCell className="text-right">
                  {summary.variants.length > 1 ? (
                    <Badge variant="secondary" className="font-mono font-normal tabular-nums">
                      {summary.variants.length}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
        {paddingBottom > 0 && (
          <tr>
            <td style={{ height: paddingBottom }} colSpan={columnCount} />
          </tr>
        )}
      </TableBody>
    </Table>
  );
}
