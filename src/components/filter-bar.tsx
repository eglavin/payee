"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  emptyFilters,
  getAvailableBanks,
  getDateBounds,
  getDatePresets,
  hasActiveFilters,
  UNCATEGORIZED_FILTER_VALUE,
  type TransactionFilters,
} from "@/lib/filter-transactions";
import { formatDate } from "@/lib/format";
import type { Category } from "@/lib/categories";
import type { Transaction } from "@/lib/types";

const ALL_CATEGORIES_VALUE = "all";

interface FilterBarProps {
  transactions: Transaction[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  filteredCount: number;
  totalCount: number;
  categories: Category[];
}

export function FilterBar({
  transactions,
  filters,
  onFiltersChange,
  filteredCount,
  totalCount,
  categories,
}: FilterBarProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const availableBanks = useMemo(
    () => getAvailableBanks(transactions),
    [transactions],
  );

  const dateBounds = useMemo(() => getDateBounds(transactions), [transactions]);
  const presets = useMemo(
    () => (dateBounds ? getDatePresets(dateBounds.max) : []),
    [dateBounds],
  );

  const dateRangeLabel =
    filters.dateFrom && filters.dateTo
      ? `${formatDate(filters.dateFrom)} – ${formatDate(filters.dateTo)}`
      : "All dates";

  function setDateRange(range: { from: Date | null; to: Date | null }) {
    onFiltersChange({ ...filters, dateFrom: range.from, dateTo: range.to });
  }

  const calendarSelected: DateRange | undefined = filters.dateFrom
    ? { from: filters.dateFrom, to: filters.dateTo ?? undefined }
    : undefined;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Date range</Label>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-[220px] justify-start font-normal"
                />
              }
            >
              <CalendarIcon className="size-4" />
              {dateRangeLabel}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="flex flex-col gap-1 border-r p-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="justify-start font-normal"
                      onClick={() => {
                        setDateRange(preset.range());
                        setDatePopoverOpen(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Calendar
                  mode="range"
                  selected={calendarSelected}
                  defaultMonth={filters.dateFrom ?? dateBounds?.max}
                  onSelect={(range) =>
                    setDateRange({
                      from: range?.from ?? null,
                      to: range?.to ?? null,
                    })
                  }
                  numberOfMonths={2}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payee-search">Payee search</Label>
          <div className="relative w-[220px]">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="payee-search"
              placeholder="Search payees..."
              className="pl-8"
              value={filters.payeeSearch}
              onChange={(e) =>
                onFiltersChange({ ...filters, payeeSearch: e.target.value })
              }
            />
          </div>
        </div>

        {availableBanks.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-filter">Bank</Label>
            <Select
              value={filters.bank ?? "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  bank: value === "all" ? null : value,
                })
              }
            >
              <SelectTrigger id="bank-filter" className="w-[150px]">
                <SelectValue placeholder="All banks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All banks</SelectItem>
                {availableBanks.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-filter">Category</Label>
          <Select
            value={filters.category ?? ALL_CATEGORIES_VALUE}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                category: value === ALL_CATEGORIES_VALUE ? null : value,
              })
            }
          >
            <SelectTrigger id="category-filter" className="w-[150px]">
              <SelectValue placeholder="All categories">
                {(value: string | null) => {
                  if (!value || value === ALL_CATEGORIES_VALUE)
                    return "All categories";
                  if (value === UNCATEGORIZED_FILTER_VALUE)
                    return "Uncategorized";
                  return (
                    categories.find((c) => c.id === value)?.label ??
                    "All categories"
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>
                All categories
              </SelectItem>
              <SelectItem value={UNCATEGORIZED_FILTER_VALUE}>
                Uncategorized
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="min-amount">Min amount</Label>
          <Input
            id="min-amount"
            type="number"
            placeholder="0"
            className="w-[100px]"
            value={filters.minAmount ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minAmount:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="max-amount">Max amount</Label>
          <Input
            id="max-amount"
            type="number"
            placeholder="Any"
            className="w-[100px]"
            value={filters.maxAmount ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxAmount:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {hasActiveFilters(filters) && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} transactions
          </p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange(emptyFilters)}
          >
            <X className="size-4" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
