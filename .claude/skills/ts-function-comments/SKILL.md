---
name: ts-function-comments
description: Use this skill whenever writing, adding, or editing JSDoc comments on TypeScript or JavaScript functions/methods. Trigger on requests to document a function, add comments, write JSDoc, or generate code that includes exported functions needing documentation.
---

# TypeScript/JavaScript Function Comment Style

When writing a JSDoc comment for a TypeScript or JavaScript function, follow this exact layout.

## Structure

1. `/**` opening line.
2. Summary: one or two full sentences describing what the function does. If the function has non-obvious edge-case or fallback behavior (e.g. invalid input, defaults), state it explicitly here as a second sentence.
3. Blank comment line (`*`).
4. *(Optional)* `@remarks` — only include when there's a non-obvious caveat, locale/environment assumption, performance note, or design rationale worth calling out (e.g. "always formats with the en-IE locale regardless of currency passed in"). Keep it to 1-3 sentences. Follow with a blank comment line. Omit entirely for straightforward functions — don't add it just to fill space.
5. `@param name Description.` — one line per parameter, in signature order.
   - Do **not** repeat the TypeScript type in the tag (no `{string}` or `(string)`) — TypeScript already provides it.
   - Description is a full sentence or clear phrase. Mention default/fallback values here if relevant (e.g. "Defaults to X if not provided or invalid.").
6. `@returns Description.` — a full sentence describing what's returned.
7. Blank comment line (`*`).
8. `@example` block containing a fenced ` ```ts ` code snippet that:
   - Calls the function with realistic sample arguments.
   - Shows the result via `console.log(...)`.
   - Includes the expected output as an inline `// Output: "..."` comment.
   - If the function has meaningful default behavior, include a second example call demonstrating it.
9. `*/` closing line.

## Rules

- Only include `@param`/`@returns` for parameters/values that exist — omit `@returns` for `void` functions.
- Only add `@example` for functions with non-trivial behavior. Skip it for trivial one-line getters/setters.
- No `@throws` unless the function can actually throw and that's meaningful to the caller (most functions here swallow errors internally instead, per the fallback pattern below — don't invent throwing behavior).
- Keep the summary free of implementation detail ("uses Intl.NumberFormat internally") — describe behavior, not implementation.
- Prefer describing fallback/defaulting behavior in prose over documenting internal try/catch mechanics.

## Reference examples

```ts
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
```
