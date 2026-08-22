import { parse } from "date-fns";

/**
 * Formats a number as a currency string using the specified currency code.
 * If the provided currency code is invalid, it defaults to "EUR".
 *
 * @param amount The numeric amount to format as currency.
 * @param currency The currency code (e.g., "USD", "EUR"). Defaults to "EUR" if not provided or invalid.
 * @returns A string representing the formatted currency amount.
 *
 * @example
 * ```ts
 * const formattedAmount = formatCurrency(1234.56, "USD");
 * console.log(formattedAmount); // Output: "$1,234.56"
 *
 * const defaultFormattedAmount = formatCurrency(1234.56);
 * console.log(defaultFormattedAmount); // Output: "€1,234.56"
 * ```
 */
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }
}

/**
 * Formats a month string from "YYYY-MM" to "MMM YYYY" (e.g., "Jan 2023").
 *
 * @param month Value in the format of "YYYY-MM"
 * @returns Formatted month in the format of "MMM YYYY" (e.g., "Jan 2023")
 *
 * @example
 * ```ts
 * const formattedMonth = formatMonth("2023-01");
 * console.log(formattedMonth); // Output: "Jan 2023"
 * ```
 */
export function formatMonth(month: string): string {
  const date = parse(month, "yyyy-MM", new Date());
  return date.toLocaleDateString("en-IE", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a Date object into a string representation in the format "DD MMM YYYY" (e.g., "01 Jan 2023").
 *
 * @param date The Date object to format.
 * @returns A string representing the formatted date in the format "DD MMM YYYY" (e.g., "01 Jan 2023").
 *
 * @example
 * ```ts
 * const formattedDate = formatDate(new Date(2023, 0, 1));
 * console.log(formattedDate); // Output: "01 Jan 2023"
 * ```
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
