const KNOWN_PREFIXES = [
  "VDC-",
  "VDP-",
  "VDA-",
  "D/D ",
  "TRANSFER FROM ",
  "TRANSFER TO ",
];

/**
 * Strips a known export-format noise prefix (e.g. AIB's card-type markers,
 * Revolut's "Transfer from/to ") off the front of a payee string. Matching
 * is case-insensitive; if no known prefix matches, the trimmed input is
 * returned unchanged.
 *
 * @param raw The raw payee string, as it appears in the source export.
 * @returns The payee with any matching prefix removed and trimmed, preserving the original casing of the remainder.
 *
 * @example
 * ```ts
 * console.log(stripKnownPrefixes("VDC-Tesco Stores")); // Output: "Tesco Stores"
 * console.log(stripKnownPrefixes("Transfer from Jane Doe")); // Output: "Jane Doe"
 *
 * console.log(stripKnownPrefixes("Tesco Stores")); // Output: "Tesco Stores"
 * ```
 */
export function stripKnownPrefixes(raw: string): string {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();

  for (const prefix of KNOWN_PREFIXES) {
    if (upper.startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim();
    }
  }

  return trimmed;
}
