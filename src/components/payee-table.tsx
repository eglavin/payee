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
        className="cursor-pointer select-none text-right"
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

  if (summaries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No payees to show.
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
              aria-label="Select all payees"
            />
          </TableHead>
          <TableHead>Payee</TableHead>
          <TableHead>Category</TableHead>
          {renderSortHeader("Spent", "totalDebit")}
          {renderSortHeader("Received", "totalCredit")}
          {renderSortHeader("Transactions", "count")}
          {hasMerges && renderSortHeader("Merged", "merged")}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((summary) => (
          <TableRow
            key={summary.payee}
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
        ))}
      </TableBody>
    </Table>
  );
}
