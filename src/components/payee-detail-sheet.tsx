"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PayeeTrendChart } from "@/components/payee-trend-chart";
import { CategoryPicker } from "@/components/category-picker";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category } from "@/lib/categories";
import type { PayeeSummary, Transaction } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVirtualTableRows } from "@/hooks/use-virtual-table-rows";

const COLUMN_COUNT = 4;

interface PayeeDetailSheetProps {
  summary: PayeeSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  categories: Category[];
  categoryId?: string;
  onCategoryChange: (categoryId: string | null) => void;
  onAddCategory: (label: string) => Category;
}

type SortKey = "date" | "amount";

const sortAccessors: Record<SortKey, (txn: Transaction) => number> = {
  date: (txn) => txn.date.getTime(),
  amount: (txn) => txn.credit - txn.debit,
};

export function PayeeDetailSheet({
  summary,
  open,
  onOpenChange,
  currency,
  categories,
  categoryId,
  onCategoryChange,
  onAddCategory,
}: PayeeDetailSheetProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useLocalStorage("payeeDetailTab", "transactions");

  const transactions = useMemo(() => {
    if (!summary) return [];
    const accessor = sortAccessors[sortKey];
    return [...summary.transactions].sort((a, b) => {
      const diff = accessor(a) - accessor(b);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [summary, sortKey, sortDir]);

  const isMerged = (summary?.variants.length ?? 0) > 1;

  const { containerRef, virtualItems, paddingTop, paddingBottom, measureElement } =
    useVirtualTableRows({ count: transactions.length, estimateRowHeight: 41 });

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (!e.altKey) return;
      if (e.key === "1") {
        e.preventDefault();
        setActiveTab("transactions");
      } else if (e.key === "2") {
        e.preventDefault();
        setActiveTab("trend");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setActiveTab]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function renderSortHeader(label: string, sortKeyValue: SortKey, align: "left" | "right") {
    const active = sortKey === sortKeyValue;
    return (
      <TableHead
        role="button"
        onClick={() => toggleSort(sortKeyValue)}
        className={`sticky top-0 z-10 cursor-pointer bg-card select-none ${align === "right" ? "text-right" : ""}`}
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{summary?.payee}</SheetTitle>
          <SheetDescription>
            {summary && (
              <>
                <span className="font-mono tabular-nums">{summary.count}</span> transactions ·{" "}
                <span className="font-mono tabular-nums">
                  {formatCurrency(summary.totalDebit, currency)}
                </span>{" "}
                spent ·{" "}
                <span className="font-mono tabular-nums">
                  {formatCurrency(summary.totalCredit, currency)}
                </span>{" "}
                received
              </>
            )}
          </SheetDescription>
          {summary && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Category</span>
              <CategoryPicker
                size="sm"
                categories={categories}
                categoryId={categoryId}
                onCategoryChange={onCategoryChange}
                onAddCategory={onAddCategory}
              />
            </div>
          )}
          {isMerged && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground">Merged from:</span>
              {summary!.variants.map((variant) => (
                <Badge key={variant} variant="secondary" className="font-normal">
                  {variant}
                </Badge>
              ))}
            </div>
          )}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList>
              <TabsTrigger value="transactions">
                Transactions
                <kbd className="ml-1.5 hidden rounded border bg-muted px-1 font-mono text-[10px] font-normal text-muted-foreground sm:inline-block">
                  Alt+1
                </kbd>
              </TabsTrigger>
              <TabsTrigger value="trend">
                Spend over time
                <kbd className="ml-1.5 hidden rounded border bg-muted px-1 font-mono text-[10px] font-normal text-muted-foreground sm:inline-block">
                  Alt+2
                </kbd>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="transactions" className="flex min-h-0 flex-1 flex-col">
              <Table
                containerClassName="h-full overflow-y-auto rounded-md border"
                containerRef={containerRef}
              >
                <TableHeader>
                  <TableRow>
                    {renderSortHeader("Date", "date", "left")}
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
                    const txn = transactions[virtualRow.index];
                    return (
                      <TableRow key={txn.id} data-index={virtualRow.index} ref={measureElement}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(txn.date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {[isMerged ? txn.payee : null, txn.detail]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </TableCell>
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
                  {paddingBottom > 0 && (
                    <tr>
                      <td style={{ height: paddingBottom }} colSpan={COLUMN_COUNT} />
                    </tr>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="trend" className="min-h-0 flex-1 overflow-y-auto pt-2">
              <PayeeTrendChart
                transactions={summary?.transactions ?? []}
                currency={currency}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
