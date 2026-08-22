import { format } from "date-fns";
import type { Category } from "./categories";

export interface CategoryExportData {
  customCategories: Category[];
  assignments: Record<string, string>;
}

const EXPORT_VERSION = 1;

/** Serializes custom categories and payee assignments to a portable JSON file. */
export function buildCategoryExportJson(data: CategoryExportData): string {
  return JSON.stringify(
    {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      customCategories: data.customCategories,
      assignments: data.assignments,
    },
    null,
    2,
  );
}

export function categoryExportFileName(): string {
  return `payee-categories-${format(new Date(), "yyyyMMdd-HHmm")}.json`;
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    typeof c.label === "string" &&
    c.label.length > 0 &&
    typeof c.color === "string"
  );
}

function isAssignments(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");
}

/**
 * Parses and validates a previously exported categories JSON file.
 * Throws a descriptive `Error` if the file isn't a recognizable export.
 */
export function parseCategoryImport(json: string): CategoryExportData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("That file doesn't look like a categories export.");
  }

  const { customCategories, assignments } = parsed as Record<string, unknown>;

  if (!Array.isArray(customCategories) || !customCategories.every(isCategory)) {
    throw new Error("That file is missing valid custom categories.");
  }
  if (!isAssignments(assignments)) {
    throw new Error("That file is missing valid category assignments.");
  }

  return {
    customCategories: customCategories.map((c) => ({ ...c, builtin: false })),
    assignments,
  };
}
