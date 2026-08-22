import type { Category } from "./categories";
import type { PayeeSummary } from "./types";

const UNCATEGORIZED_ID = "__uncategorized__";
const UNCATEGORIZED_COLOR = "#94a3b8";

export interface CategorySpend {
  categoryId: string;
  label: string;
  color: string;
  spend: number;
}

/**
 * Sums each payee's spend into its assigned category (via `getCategoryId`),
 * folding uncategorized payees into a single "Uncategorized" bucket, and
 * returns the top `n` by spend.
 */
export function topCategoriesBySpend(
  summaries: PayeeSummary[],
  getCategoryId: (payee: string) => string | undefined,
  categories: Category[],
  n: number,
): CategorySpend[] {
  const spendById = new Map<string, number>();

  for (const summary of summaries) {
    if (summary.totalDebit <= 0) continue;
    const id = getCategoryId(summary.payee) ?? UNCATEGORIZED_ID;
    spendById.set(id, (spendById.get(id) ?? 0) + summary.totalDebit);
  }

  const results: CategorySpend[] = Array.from(spendById.entries()).map(([id, spend]) => {
    if (id === UNCATEGORIZED_ID) {
      return { categoryId: id, label: "Uncategorized", color: UNCATEGORIZED_COLOR, spend };
    }
    const category = categories.find((c) => c.id === id);
    return {
      categoryId: id,
      label: category?.label ?? id,
      color: category?.color ?? UNCATEGORIZED_COLOR,
      spend,
    };
  });

  return results.sort((a, b) => b.spend - a.spend).slice(0, n);
}
