"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { BUILT_IN_CATEGORIES, getCategoryKey, type Category } from "@/lib/categories";
import type { CategoryExportData } from "@/lib/category-export";

const CUSTOM_CATEGORY_COLORS = [
  "#16a34a",
  "#ea580c",
  "#0891b2",
  "#2563eb",
  "#9333ea",
  "#db2777",
  "#7c3aed",
  "#059669",
  "#78716c",
  "#65a30d",
  "#64748b",
  "#dc2626",
];

function slugify(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `category-${Date.now()}`;
}

/**
 * Persists payee category assignments (keyed by `getCategoryKey`) and any
 * user-added custom categories to localStorage. Should be called once and
 * the result passed down as props — `useLocalStorage` instances don't sync
 * across separate call sites within the same tab.
 */
export function usePayeeCategories() {
  const [assignments, setAssignments] = useLocalStorage<Record<string, string>>(
    "payeeCategoryAssignments",
    {},
  );
  const [customCategories, setCustomCategories] = useLocalStorage<Category[]>(
    "customCategories",
    [],
  );

  const categories = useMemo(
    () => [...BUILT_IN_CATEGORIES, ...customCategories],
    [customCategories],
  );

  const getCategoryId = useCallback(
    (payee: string) => assignments[getCategoryKey(payee)],
    [assignments],
  );

  const setCategoryId = useCallback(
    (payee: string, categoryId: string | null) => {
      const key = getCategoryKey(payee);
      setAssignments((prev) => {
        if (categoryId === null) {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: categoryId };
      });
    },
    [setAssignments],
  );

  const addCustomCategory = useCallback(
    (label: string): Category => {
      const trimmed = label.trim();
      const existingIds = new Set(categories.map((c) => c.id));
      const slug = slugify(trimmed);
      let id = slug;
      let suffix = 2;
      while (existingIds.has(id)) {
        id = `${slug}-${suffix++}`;
      }
      const color = CUSTOM_CATEGORY_COLORS[existingIds.size % CUSTOM_CATEGORY_COLORS.length];
      const category: Category = { id, label: trimmed, color, builtin: false };
      setCustomCategories((prev) => [...prev, category]);
      return category;
    },
    [categories, setCustomCategories],
  );

  const removeCustomCategory = useCallback(
    (id: string) => {
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      setAssignments((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key] === id) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
    [setCustomCategories, setAssignments],
  );

  // Merges imported data onto what's already saved: new custom categories are
  // added (skipping any id that already exists, built-in or custom, since an
  // imported category can never win over an existing one with the same id —
  // `categories` is built built-ins-first and `Array.find` takes the first
  // match), and imported assignments overwrite existing ones for the same key.
  const importCategories = useCallback(
    (data: CategoryExportData) => {
      setCustomCategories((prev) => {
        const existingIds = new Set([...BUILT_IN_CATEGORIES, ...prev].map((c) => c.id));
        const toAdd = data.customCategories.filter((c) => !existingIds.has(c.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
      setAssignments((prev) => ({ ...prev, ...data.assignments }));
    },
    [setCustomCategories, setAssignments],
  );

  return {
    categories,
    customCategories,
    assignments,
    getCategoryId,
    setCategoryId,
    addCustomCategory,
    removeCustomCategory,
    importCategories,
  };
}
