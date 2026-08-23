"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FileText, Info, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { FileUpload, type LoadedFileResult } from "@/components/file-upload";
import { FilterBar } from "@/components/filter-bar";
import { Footer } from "@/components/footer";
import { SummaryCards } from "@/components/summary-cards";
import { PayeeTable } from "@/components/payee-table";
import { TransactionsTable } from "@/components/transactions-table";
import { TopPayeesChart } from "@/components/top-payees-chart";
import { SpendingTrendChart } from "@/components/spending-trend-chart";
import { PayeeDetailSheet } from "@/components/payee-detail-sheet";
import { CategoryPicker } from "@/components/category-picker";
import { CategoryImportExport } from "@/components/category-import-export";
import { SelectedTransactionsDialog } from "@/components/selected-transactions-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupByPayee, groupByPayeeFuzzy } from "@/lib/aggregate";
import { bankFormats } from "@/lib/formats";
import {
  emptyFilters,
  filterTransactions,
  getAvailableBanks,
  type TransactionFilters,
} from "@/lib/filter-transactions";
import { prepareTransactions, detectCurrencies, type LoadedFile } from "@/lib/loaded-files";
import type { Transaction } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { usePayeeCategories } from "@/hooks/use-payee-categories";

const BULK_CATEGORY_CONFIRM_THRESHOLD = 10;

const aboutItems = [
  {
    icon: FileText,
    title: "Reads your bank exports",
    body: `Supports ${bankFormats.map((f) => f.label).join(" and ")} CSV exports — upload one or several files at once, even from different banks.`,
  },
  {
    icon: Sparkles,
    title: "Groups spending by payee",
    body: 'Optionally merges near-duplicate names (e.g. "VDC-TESCO STORES" and "TESCO STORES 4") into a single payee.',
  },
  {
    icon: TrendingUp,
    title: "Charts and totals",
    body: "See money in/out, top payees by spend, and spending trends over time — filterable by date, amount, bank, payee, and category.",
  },
  {
    icon: ShieldCheck,
    title: "Stays on your device",
    body: "Files are parsed entirely in your browser and never uploaded anywhere. Categories you tag are remembered locally for next time.",
  },
];

export function Dashboard() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const nextIdRef = useRef(0);
  const [selectedPayee, setSelectedPayee] = useState<string | null>(null);
  const [fuzzyMatching, setFuzzyMatching] = useLocalStorage("fuzzyMatching", false);
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
  const [tableView, setTableView] = useState<"payee" | "date">("payee");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedPayeeNames, setSelectedPayeeNames] = useState<Set<string>>(new Set());
  const [pendingBulkCategory, setPendingBulkCategory] = useState<{
    categoryId: string | null;
    payees: string[];
  } | null>(null);
  const {
    categories,
    customCategories,
    assignments,
    getCategoryId,
    setCategoryId,
    addCustomCategory,
    importCategories,
  } = usePayeeCategories();

  const transactions = useMemo(
    () => files.flatMap((f) => f.transactions),
    [files],
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters, getCategoryId),
    [transactions, filters, getCategoryId],
  );

  const payeeSummaries = useMemo(
    () =>
      fuzzyMatching
        ? groupByPayeeFuzzy(filteredTransactions)
        : groupByPayee(filteredTransactions),
    [filteredTransactions, fuzzyMatching],
  );

  const currencies = useMemo(() => detectCurrencies(transactions), [transactions]);
  const currency = currencies[0] ?? "EUR";

  const totalDebit = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.debit, 0),
    [filteredTransactions],
  );
  const totalCredit = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.credit, 0),
    [filteredTransactions],
  );

  // Maps a transaction's raw payee name to whichever group it currently
  // belongs to, so the "by date" transaction list can open the right
  // PayeeDetailSheet even when fuzzy matching has merged it under a
  // different canonical label.
  const payeeByRawName = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of payeeSummaries) {
      for (const txn of s.transactions) {
        map.set(txn.payee, s.payee);
      }
    }
    return map;
  }, [payeeSummaries]);

  const resolvePayee = useCallback(
    (txn: Transaction) => payeeByRawName.get(txn.payee) ?? txn.payee,
    [payeeByRawName],
  );

  const selectedSummary =
    payeeSummaries.find((s) => s.payee === selectedPayee) ?? null;

  const selectedTransactions = useMemo(
    () => filteredTransactions.filter((t) => selectedIds.has(t.id)),
    [filteredTransactions, selectedIds],
  );

  // Drops stale payee-table selections whenever the set of payees changes
  // (file removal, filters, or the fuzzy-matching toggle renaming groups).
  // Any subsequent selection change persists this pruned set as the new state.
  const validSelectedPayeeNames = useMemo(() => {
    if (selectedPayeeNames.size === 0) return selectedPayeeNames;
    const validNames = new Set(payeeSummaries.map((s) => s.payee));
    const next = new Set([...selectedPayeeNames].filter((p) => validNames.has(p)));
    return next.size === selectedPayeeNames.size ? selectedPayeeNames : next;
  }, [selectedPayeeNames, payeeSummaries]);

  function handleFilesLoaded(results: LoadedFileResult[]) {
    const newFiles: LoadedFile[] = results.map((result) => {
      const startId = nextIdRef.current;
      const txns = prepareTransactions(result.transactions, startId, result.formatLabel);
      nextIdRef.current = startId + txns.length;
      return {
        id: crypto.randomUUID(),
        name: result.name,
        formatLabel: result.formatLabel,
        skippedRows: result.skippedRows,
        transactions: txns,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
    setFilters(emptyFilters);
  }

  function handleRemoveFile(fileId: string) {
    const next = files.filter((f) => f.id !== fileId);
    const remainingTransactions = next.flatMap((f) => f.transactions);
    const remainingIds = new Set(remainingTransactions.map((t) => t.id));
    setFiles(next);
    setSelectedIds((ids) => new Set([...ids].filter((id) => remainingIds.has(id))));
    if (filters.bank && !getAvailableBanks(remainingTransactions).includes(filters.bank)) {
      setFilters((f) => ({ ...f, bank: null }));
    }
  }

  function handleClearAll() {
    setFiles([]);
    nextIdRef.current = 0;
    setSelectedPayee(null);
    setFilters(emptyFilters);
    setSelectedIds(new Set());
    setSelectedPayeeNames(new Set());
  }

  function applyBulkCategory(categoryId: string | null, payees: string[]) {
    for (const payee of payees) {
      setCategoryId(payee, categoryId);
    }
    setSelectedPayeeNames(new Set());
  }

  function handleBulkCategoryChange(categoryId: string | null) {
    const payees = [...validSelectedPayeeNames];
    if (payees.length > BULK_CATEGORY_CONFIRM_THRESHOLD) {
      setPendingBulkCategory({ categoryId, payees });
    } else {
      applyBulkCategory(categoryId, payees);
    }
  }

  const hasData = transactions.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payee
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload one or more bank transaction exports to see spending broken down by
            payee.
          </p>
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          <CategoryImportExport
            customCategories={customCategories}
            assignments={assignments}
            onImport={importCategories}
          />
          <ThemeToggle />
        </div>
      </div>

      <FileUpload
        files={files}
        onFilesLoaded={handleFilesLoaded}
        onRemoveFile={handleRemoveFile}
        onClearAll={handleClearAll}
      />

      {currencies.length > 1 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Loaded files use different currencies ({currencies.join(", ")}) — amounts are
          shown as {currency}, so totals across currencies won&rsquo;t be meaningful.
        </p>
      )}

      {!hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What this does</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {aboutItems.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              This is not a financial advisor. It only visualizes the transactions you
              upload — it doesn&rsquo;t give financial, investment, or tax advice, so
              don&rsquo;t rely on it to make financial decisions.
            </p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          <FilterBar
            transactions={transactions}
            filters={filters}
            onFiltersChange={setFilters}
            filteredCount={filteredTransactions.length}
            totalCount={transactions.length}
            categories={categories}
          />

          <div className="flex items-center gap-2">
            <Switch
              id="fuzzy-matching"
              checked={fuzzyMatching}
              onCheckedChange={setFuzzyMatching}
            />
            <Label htmlFor="fuzzy-matching">Fuzzy match payees</Label>
            <span className="text-sm text-muted-foreground">
              Merge near-duplicate payee names (e.g. &ldquo;VDC-TESCO STORES&rdquo; and
              &ldquo;VDP-TESCO STORES 4&rdquo;)
            </span>
          </div>

          <SummaryCards
            totalDebit={totalDebit}
            totalCredit={totalCredit}
            currency={currency}
            payeeCount={payeeSummaries.length}
            transactionCount={filteredTransactions.length}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <TopPayeesChart
              summaries={payeeSummaries}
              currency={currency}
              categories={categories}
              getCategoryId={getCategoryId}
            />
            <SpendingTrendChart
              transactions={filteredTransactions}
              summaries={payeeSummaries}
              currency={currency}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>{tableView === "payee" ? "All payees" : "All transactions"}</CardTitle>
              <div className="flex items-center gap-2">
                {tableView === "date" && selectedIds.size > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setExportOpen(true)}>
                    View selected (<span className="font-mono tabular-nums">{selectedIds.size}</span>)
                  </Button>
                )}
                {tableView === "payee" && validSelectedPayeeNames.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-mono tabular-nums">{validSelectedPayeeNames.size}</span> selected
                    </span>
                    <CategoryPicker
                      size="sm"
                      placeholder="Set category"
                      categories={categories}
                      onCategoryChange={handleBulkCategoryChange}
                      onAddCategory={addCustomCategory}
                    />
                  </div>
                )}
                <Tabs value={tableView} onValueChange={setTableView}>
                  <TabsList>
                    <TabsTrigger value="payee">By payee</TabsTrigger>
                    <TabsTrigger value="date">By date</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {tableView === "payee" ? (
                <PayeeTable
                  summaries={payeeSummaries}
                  currency={currency}
                  onSelectPayee={setSelectedPayee}
                  categories={categories}
                  getCategoryId={getCategoryId}
                  setCategoryId={setCategoryId}
                  onAddCategory={addCustomCategory}
                  selectedPayees={validSelectedPayeeNames}
                  onSelectionChange={setSelectedPayeeNames}
                />
              ) : (
                <TransactionsTable
                  transactions={filteredTransactions}
                  currency={currency}
                  resolvePayee={resolvePayee}
                  onSelectPayee={setSelectedPayee}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  categories={categories}
                  getCategoryId={getCategoryId}
                  setCategoryId={setCategoryId}
                  onAddCategory={addCustomCategory}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <PayeeDetailSheet
        summary={selectedSummary}
        open={selectedPayee !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPayee(null);
        }}
        currency={currency}
        categories={categories}
        categoryId={selectedSummary ? getCategoryId(selectedSummary.payee) : undefined}
        onCategoryChange={(categoryId) => {
          if (selectedSummary) setCategoryId(selectedSummary.payee, categoryId);
        }}
        onAddCategory={addCustomCategory}
      />

      <SelectedTransactionsDialog
        transactions={selectedTransactions}
        open={exportOpen}
        onOpenChange={setExportOpen}
        currency={currency}
      />

      <Dialog
        open={pendingBulkCategory !== null}
        onOpenChange={(open) => {
          if (!open) setPendingBulkCategory(null);
        }}
      >
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Change category for{" "}
              <span className="font-mono tabular-nums">{pendingBulkCategory?.payees.length}</span>{" "}
              payees?
            </DialogTitle>
            <DialogDescription>
              {pendingBulkCategory?.categoryId ? (
                <>
                  This sets every selected payee&rsquo;s category to{" "}
                  <span className="font-medium text-foreground">
                    {categories.find((c) => c.id === pendingBulkCategory.categoryId)?.label ??
                      pendingBulkCategory.categoryId}
                  </span>
                  . This can&rsquo;t be undone automatically.
                </>
              ) : (
                <>
                  This clears the category on every selected payee. This can&rsquo;t be undone
                  automatically.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                if (!pendingBulkCategory) return;
                applyBulkCategory(pendingBulkCategory.categoryId, pendingBulkCategory.payees);
                setPendingBulkCategory(null);
              }}
            >
              Change{" "}
              <span className="font-mono tabular-nums">{pendingBulkCategory?.payees.length}</span>{" "}
              payees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
