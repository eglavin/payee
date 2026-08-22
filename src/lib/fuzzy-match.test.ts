import { describe, expect, it } from "vitest";
import { clusterPayeeKeys, diceCoefficient, normalizePayeeKey } from "./fuzzy-match";
import { stripKnownPrefixes } from "./payee-prefixes";

/** Mirrors the pipeline every real payee goes through: strip prefixes first, then normalize. */
function keyOf(raw: string): string {
  return normalizePayeeKey(stripKnownPrefixes(raw));
}

describe("normalizePayeeKey", () => {
  // Inputs are already prefix-stripped (see loaded-files.ts).

  it("strips trailing store/reference numbers", () => {
    expect(normalizePayeeKey("TESCO STORES 4")).toBe("TESCO STORES");
    expect(normalizePayeeKey("MCDONALDS 7021")).toBe("MCDONALDS");
  });

  it("normalizes case and collapses whitespace", () => {
    expect(normalizePayeeKey("Aston Villa FC")).toBe(normalizePayeeKey("ASTON VILLA FC"));
    expect(normalizePayeeKey("  TESCO   STORES  ")).toBe("TESCO STORES");
  });
});

describe("diceCoefficient", () => {
  it("is 1 for identical strings and 0 for completely different ones", () => {
    expect(diceCoefficient("TESCO", "TESCO")).toBe(1);
    expect(diceCoefficient("AB", "XY")).toBe(0);
  });

  it("scores near-identical truncated strings highly", () => {
    const score = diceCoefficient("GOOGLE*GOOGLE", "GOOGLE*GOOGL");
    expect(score).toBeGreaterThan(0.9);
  });
});

describe("clusterPayeeKeys", () => {
  it("merges near-duplicate keys but leaves distinct ones alone", () => {
    const counts = new Map([
      ["TESCO STORES", 5],
      ["TESCO STORE", 1],
      ["NETFLIX.COM", 3],
    ]);

    const canonical = clusterPayeeKeys(counts, 0.8);

    expect(canonical.get("TESCO STORES")).toBe(canonical.get("TESCO STORE"));
    expect(canonical.get("NETFLIX.COM")).not.toBe(canonical.get("TESCO STORES"));
  });

  it("picks the most frequent key as the canonical label", () => {
    const counts = new Map([
      ["TESCO STORES", 10],
      ["TESCO STORE", 1],
    ]);

    const canonical = clusterPayeeKeys(counts, 0.8);

    expect(canonical.get("TESCO STORE")).toBe("TESCO STORES");
  });

  it("does not merge unrelated payees that only share one common word", () => {
    // Regression: whole-string bigram similarity alone rated these ~0.58
    // similar (they share "IRELAND"), which wrongly merged a grocery
    // shop into a phone bill. Word-level overlap should block this.
    const counts = new Map([
      ["LIDL IRELAND L", 1],
      ["THREE IRELAND", 2],
    ]);

    const canonical = clusterPayeeKeys(counts);

    expect(canonical.get("LIDL IRELAND L")).not.toBe(canonical.get("THREE IRELAND"));
  });

  it("still merges truncated multi-word names via a shared exact-token hub", () => {
    const counts = new Map([
      ["GOOGLE ONE", 1],
      ["GOOGLE*GOOGLE", 2],
      ["GOOGLE*YOUTUBE", 1],
      ["GOOGLE YOUTUBE", 3],
    ]);

    const canonical = clusterPayeeKeys(counts);
    const labels = new Set(canonical.values());

    expect(labels.size).toBe(1);
  });

  it("does not merge different merchants that share a trailing city name", () => {
    // Regression: "CEX GALWAY 01", "DUNELM GALWAY", "PENNEYS GALWAY" are
    // three unrelated shops that all happen to end in the city "GALWAY".
    // AIB truncates from the end, so the leading word is the real brand —
    // matching only requires that to differ to keep them apart.
    const counts = new Map([
      ["CEX GALWAY", 3],
      ["DUNELM GALWAY", 2],
      ["PENNEYS GALWAY", 1],
    ]);

    const canonical = clusterPayeeKeys(counts);
    const labels = new Set(canonical.values());

    expect(labels.size).toBe(3);
  });

  it("does not merge different people's Revolut transfers, but merges to/from the same person", () => {
    // Regression: Revolut's "Transfer from/to NAME" descriptions all share
    // the leading word "Transfer", so without stripping that preamble
    // first, firstTokensMatch's gate let every transfer cluster together
    // regardless of who the money was to/from.
    const keys = [
      keyOf("Transfer from BERNADETTE EUCHARIA GLAVIN"),
      keyOf("Transfer from KILLIAN PATRICK GLAVIN"),
      keyOf("Transfer to EDWARD PATRICK DUNNE"),
      keyOf("Transfer from EDWARD PATRICK DUNNE"),
      keyOf("Transfer from GAVIN HYNES"),
      keyOf("Transfer from PADRAIG DUNNE ANDERSON"),
      keyOf("Transfer to PADRAIG DUNNE ANDERSON"),
    ];
    const counts = new Map(keys.map((k) => [k, 1]));

    const canonical = clusterPayeeKeys(counts);

    expect(new Set(canonical.values()).size).toBe(5);
    expect(canonical.get(keyOf("Transfer to EDWARD PATRICK DUNNE"))).toBe(
      canonical.get(keyOf("Transfer from EDWARD PATRICK DUNNE")),
    );
    expect(canonical.get(keyOf("Transfer from PADRAIG DUNNE ANDERSON"))).toBe(
      canonical.get(keyOf("Transfer to PADRAIG DUNNE ANDERSON")),
    );
    expect(canonical.get(keyOf("Transfer from BERNADETTE EUCHARIA GLAVIN"))).not.toBe(
      canonical.get(keyOf("Transfer from KILLIAN PATRICK GLAVIN")),
    );
  });
});
