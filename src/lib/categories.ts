import { normalizePayeeKey } from "./fuzzy-match";

export interface Category {
  id: string;
  label: string;
  /** Hex color used for the small dot in CategoryBadge. */
  color: string;
  builtin: boolean;
}

export const BUILT_IN_CATEGORIES: Category[] = [
  { id: "groceries", label: "Groceries", color: "#16a34a", builtin: true },
  { id: "takeout", label: "Takeout & Restaurants", color: "#ea580c", builtin: true },
  { id: "forecourt", label: "Forecourt & Fuel", color: "#facc15", builtin: true },
  { id: "bills", label: "Bills & Utilities", color: "#0891b2", builtin: true },
  { id: "transport", label: "Transport", color: "#2563eb", builtin: true },
  { id: "shopping", label: "Shopping", color: "#9333ea", builtin: true },
  { id: "entertainment", label: "Entertainment", color: "#db2777", builtin: true },
  { id: "subscriptions", label: "Subscriptions", color: "#7c3aed", builtin: true },
  { id: "health", label: "Health & Fitness", color: "#059669", builtin: true },
  { id: "housing", label: "Rent & Housing", color: "#78716c", builtin: true },
  { id: "income", label: "Income", color: "#65a30d", builtin: true },
  { id: "transfers", label: "Transfers", color: "#64748b", builtin: true },
  { id: "fees", label: "Fees & Charges", color: "#dc2626", builtin: true },
  { id: "other", label: "Other", color: "#71717a", builtin: true },
];

/**
 * Stable lookup key for category assignments — reuses the same
 * normalization as fuzzy payee matching, so a tag reattaches to a payee
 * across future uploads even if store numbers/whitespace vary, regardless
 * of whether fuzzy matching is enabled.
 */
export function getCategoryKey(payee: string): string {
  return normalizePayeeKey(payee);
}
