"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
import type { Transaction } from "@/lib/types";

const chartConfig = {
  debit: { label: "Spent", color: "var(--chart-1)" },
  credit: { label: "Received", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface PayeeTrendChartProps {
  transactions: Transaction[];
  currency: string;
}

export function PayeeTrendChart({ transactions, currency }: PayeeTrendChartProps) {
  const data = useMemo(
    () =>
      monthlyTrend(transactions).map((m) => ({
        ...m,
        monthLabel: formatMonth(m.month),
      })),
    [transactions],
  );

  if (data.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Not enough months of data to chart a trend yet.
      </p>
    );
  }

  const chartDescriptionId = "payee-trend-chart-description";
  const chartDescription = data
    .map(
      (m) =>
        `${m.monthLabel}: spent ${formatCurrency(m.debit, currency)}, received ${formatCurrency(m.credit, currency)}`,
    )
    .join("; ");

  return (
    <>
      <p id={chartDescriptionId} className="sr-only">
        {chartDescription}
      </p>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[350px] w-full"
        role="img"
        aria-label="Line chart: monthly spending and income for this payee"
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
  );
}
