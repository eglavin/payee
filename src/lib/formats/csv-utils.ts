/** Parses a numeric CSV field (stripping thousands-separator commas), defaulting blank/invalid values to 0. */
export function parseAmount(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  if (cleaned === "") return 0;
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Like parseAmount, but a blank/invalid value is `null` rather than 0 — for fields where "no value" is meaningful (e.g. balance). */
export function parseNullableAmount(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const parsed = parseAmount(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/** True if every field in a parsed CSV row is empty (a fully blank trailing line). */
export function isBlankRow<T extends object>(row: T): boolean {
  return Object.values(row).every((value) => !value || String(value).trim() === "");
}

function normalizeHeader(headerLine: string): string {
  return headerLine
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .join(",");
}

/** Precomputes an expected header's normalized form and returns a `matchesHeader` comparator for it. */
export function matchesExactHeader(expectedHeader: string): (headerLine: string) => boolean {
  const normalizedExpected = normalizeHeader(expectedHeader);
  return (headerLine: string) => normalizeHeader(headerLine) === normalizedExpected;
}
