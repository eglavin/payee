"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { PayeeSummary } from "@/lib/types";

const chartConfig = {
  spend: {
    label: "Spent",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface TopPayeesChartProps {
  summaries: PayeeSummary[];
  currency: string;
}

export function TopPayeesChart({ summaries, currency }: TopPayeesChartProps) {
  const data = summaries.map((s) => ({
    payee: s.payee,
    spend: Math.round(s.totalDebit * 100) / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top payees by spend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No spending to chart yet.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[320px] w-full"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontFamily: "var(--font-mono)" }}
                tickFormatter={(value) => formatCurrency(value, currency)}
              />
              <YAxis
                dataKey="payee"
                type="category"
                width={140}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: string) =>
                  value.length > 20 ? `${value.slice(0, 20)}…` : value
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono tabular-nums">
                        {formatCurrency(Number(value), currency)}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
