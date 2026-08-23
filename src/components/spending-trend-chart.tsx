"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { monthlyTrend } from "@/lib/aggregate";
import { formatCurrency, formatMonth } from "@/lib/format";
import type { PayeeSummary, Transaction } from "@/lib/types";

const chartConfig = {
  debit: { label: "Spent", color: "var(--chart-1)" },
  credit: { label: "Received", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface SpendingTrendChartProps {
  transactions: Transaction[];
  summaries: PayeeSummary[];
  currency: string;
}

export function SpendingTrendChart({
  transactions,
  summaries,
  currency,
}: SpendingTrendChartProps) {
  const [selectedPayee, setSelectedPayee] = useState<string>("all");

  // If the selected payee no longer exists in the current grouping (e.g. after
  // toggling fuzzy matching), fall back to "all" without needing an effect.
  const effectiveSelectedPayee =
    selectedPayee === "all" || summaries.some((s) => s.payee === selectedPayee)
      ? selectedPayee
      : "all";

  const selectedTransactions = useMemo(() => {
    if (effectiveSelectedPayee === "all") return transactions;
    return (
      summaries.find((s) => s.payee === effectiveSelectedPayee)?.transactions ?? []
    );
  }, [transactions, summaries, effectiveSelectedPayee]);

  const data = useMemo(
    () =>
      monthlyTrend(selectedTransactions).map((m) => ({
        ...m,
        monthLabel: formatMonth(m.month),
      })),
    [selectedTransactions],
  );

  const payeeNames = useMemo(
    () => summaries.map((s) => s.payee).sort(),
    [summaries],
  );

  const chartDescriptionId = "spending-trend-chart-description";
  const chartLabel =
    effectiveSelectedPayee === "all"
      ? "Line chart: monthly spending and income across all payees"
      : `Line chart: monthly spending and income for ${effectiveSelectedPayee}`;
  const chartDescription = data
    .map(
      (m) =>
        `${m.monthLabel}: spent ${formatCurrency(m.debit, currency)}, received ${formatCurrency(m.credit, currency)}`,
    )
    .join("; ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Spending over time</CardTitle>
        <Select
          value={effectiveSelectedPayee}
          onValueChange={(value) => setSelectedPayee(value ?? "all")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All payees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payees</SelectItem>
            {payeeNames.map((payee) => (
              <SelectItem key={payee} value={payee}>
                {payee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data to chart yet.
          </p>
        ) : (
          <>
            <p id={chartDescriptionId} className="sr-only">
              {chartDescription}
            </p>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[320px] w-full"
              role="img"
              aria-label={chartLabel}
              aria-describedby={chartDescriptionId}
            >
              <LineChart data={data} margin={{ left: 8, right: 16 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: "var(--font-mono)" }}
                  tickFormatter={(value) => formatCurrency(value, currency)}
                  width={80}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <span>
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}:{" "}
                          <span className="font-mono tabular-nums">
                            {formatCurrency(Number(value), currency)}
                          </span>
                        </span>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="debit"
                  stroke="var(--color-debit)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="credit"
                  stroke="var(--color-credit)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
