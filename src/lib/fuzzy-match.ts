/**
 * Normalizes a payee string for fuzzy matching: case, whitespace, and
 * trailing store/reference numbers. Assumes known noise prefixes were
 * already stripped upstream (see `payee-prefixes.ts`).
 */
export function normalizePayeeKey(raw: string): string {
  let value = raw.toUpperCase().trim().replace(/\s+/g, " ");
  value = value.replace(/\s+\d+$/, "").trim();
  return value || raw.trim();
}

function bigrams(value: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < value.length - 1; i++) {
    set.add(value.slice(i, i + 2));
  }
  return set;
}

/** Sørensen–Dice coefficient over character bigrams: 0 (no overlap) to 1 (identical). */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

  let overlap = 0;
  for (const bigram of bigramsA) {
    if (bigramsB.has(bigram)) overlap++;
  }

  return (2 * overlap) / (bigramsA.size + bigramsB.size);
}

function tokenize(value: string): string[] {
  return value
    .replace(/'/g, "")
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

const TOKEN_SOFT_MATCH_THRESHOLD = 0.7;

/**
 * Gates fuzzy merges on the first word matching (exactly or near-typo).
 * AIB truncates names from the end, so the first word is the real brand —
 * this rejects merges based on a shared trailing word (e.g. three different
 * shops that all end in "GALWAY").
 */
function firstTokensMatch(a: string, b: string): boolean {
  const tokenA = tokenize(a)[0];
  const tokenB = tokenize(b)[0];
  if (!tokenA || !tokenB) return false;
  return tokenA === tokenB || diceCoefficient(tokenA, tokenB) >= TOKEN_SOFT_MATCH_THRESHOLD;
}

export const DEFAULT_FUZZY_THRESHOLD = 0.5;

/**
 * Clusters normalized payee keys into likely-same-merchant groups via
 * union-find over Dice similarity, gated by firstTokensMatch. Returns a
 * map from each key to its cluster's canonical (most frequent) label.
 */
export function clusterPayeeKeys(
  keysWithCounts: Map<string, number>,
  threshold: number = DEFAULT_FUZZY_THRESHOLD,
): Map<string, string> {
  const keys = Array.from(keysWithCounts.keys());
  const parent = new Map<string, string>(keys.map((k) => [k, k]));

  function find(k: string): string {
    let root = k;
    while (parent.get(root) !== root) {
      root = parent.get(root)!;
    }
    let cur = k;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  function union(a: string, b: string) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  }

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      if (
        diceCoefficient(keys[i], keys[j]) >= threshold &&
        firstTokensMatch(keys[i], keys[j])
      ) {
        union(keys[i], keys[j]);
      }
    }
  }

  const clusters = new Map<string, string[]>();
  for (const key of keys) {
    const root = find(key);
    const members = clusters.get(root) ?? [];
    members.push(key);
    clusters.set(root, members);
  }

  const canonicalByKey = new Map<string, string>();
  for (const members of clusters.values()) {
    const canonical = [...members].sort((a, b) => {
      const countDiff = (keysWithCounts.get(b) ?? 0) - (keysWithCounts.get(a) ?? 0);
      return countDiff !== 0 ? countDiff : a.length - b.length;
    })[0];
    for (const key of members) {
      canonicalByKey.set(key, canonical);
    }
  }

  return canonicalByKey;
}
