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
import { SelectedTransactionsDialog } from "@/components/selected-transactions-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupByPayee, groupByPayeeFuzzy, topPayeesBySpend } from "@/lib/aggregate";
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
    body: "See money in/out, top payees by spend, and spending trends over time — filterable by date, amount, bank, and payee.",
  },
  {
    icon: ShieldCheck,
    title: "Stays on your device",
    body: "Files are parsed entirely in your browser and never uploaded anywhere. Nothing is saved once you close the tab.",
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

  const transactions = useMemo(
    () => files.flatMap((f) => f.transactions),
    [files],
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
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

  const topPayees = useMemo(
    () => topPayeesBySpend(payeeSummaries, 8),
    [payeeSummaries],
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
  }

  const hasData = transactions.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payee
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload one or more bank transaction exports to see spending broken down by
            payee.
          </p>
        </div>
        <ThemeToggle />
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

          <div className="grid gap-6 lg:grid-cols-2">
            <TopPayeesChart summaries={topPayees} currency={currency} />
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
                />
              ) : (
                <TransactionsTable
                  transactions={filteredTransactions}
                  currency={currency}
                  resolvePayee={resolvePayee}
                  onSelectPayee={setSelectedPayee}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
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
      />

      <SelectedTransactionsDialog
        transactions={selectedTransactions}
        open={exportOpen}
        onOpenChange={setExportOpen}
        currency={currency}
      />

      <Footer />
    </div>
  );
}
