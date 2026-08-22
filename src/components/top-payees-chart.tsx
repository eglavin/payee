"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import { topPayeesBySpend } from "@/lib/aggregate";
import { topCategoriesBySpend } from "@/lib/category-aggregate";
import type { Category } from "@/lib/categories";
import type { PayeeSummary } from "@/lib/types";

const chartConfig = {
  spend: {
    label: "Spent",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type ChartView = "payee" | "category";

interface TopPayeesChartProps {
  summaries: PayeeSummary[];
  currency: string;
  categories: Category[];
  getCategoryId: (payee: string) => string | undefined;
}

export function TopPayeesChart({
  summaries,
  currency,
  categories,
  getCategoryId,
}: TopPayeesChartProps) {
  const [view, setView] = useState<ChartView>("payee");

  const payeeData = useMemo(
    () =>
      topPayeesBySpend(summaries, 8).map((s) => ({
        label: s.payee,
        spend: Math.round(s.totalDebit * 100) / 100,
        fill: "var(--color-spend)",
      })),
    [summaries],
  );

  const categoryData = useMemo(
    () =>
      topCategoriesBySpend(summaries, getCategoryId, categories, 8).map((c) => ({
        label: c.label,
        spend: Math.round(c.spend * 100) / 100,
        fill: c.color,
      })),
    [summaries, getCategoryId, categories],
  );

  const data = view === "payee" ? payeeData : categoryData;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>
          {view === "payee" ? "Top payees by spend" : "Top categories by spend"}
        </CardTitle>
        <Tabs value={view} onValueChange={(value) => setView(value as ChartView)}>
          <TabsList>
            <TabsTrigger value="payee">Payees</TabsTrigger>
            <TabsTrigger value="category">Categories</TabsTrigger>
          </TabsList>
        </Tabs>
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
                dataKey="label"
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
              <Bar dataKey="spend" fill="var(--color-spend)" radius={4}>
                {view === "category" &&
                  data.map((entry) => <Cell key={entry.label} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
