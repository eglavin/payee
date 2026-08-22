import { aibFormat } from "./aib";
import { revolutFormat } from "./revolut";
import type { ParseResult } from "./types";

export type { BankFormat, ParseResult } from "./types";

export const bankFormats = [aibFormat, revolutFormat];

export interface DetectedParseResult extends ParseResult {
  formatLabel: string;
}

export function parseTransactions(csvText: string): DetectedParseResult {
  const headerLine = csvText.split(/\r?\n/, 1)[0] ?? "";
  const format = bankFormats.find((f) => f.matchesHeader(headerLine));

  if (!format) {
    throw new Error(
      `Unrecognized CSV format. Supported: ${bankFormats.map((f) => f.label).join(", ")}.`,
    );
  }

  return { ...format.parse(csvText), formatLabel: format.label };
}
