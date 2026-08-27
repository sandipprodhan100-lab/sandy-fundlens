/**
 * Common-stock overlap across the top ranked funds of a category.
 *
 * Answers: if I buy the five funds this category's sideways ranking picked,
 * which stocks am I actually buying five times over?
 */

import { analyse } from "./mf.server";
import { fetchHoldings } from "./holdings.server";
import { memoise } from "./memo.server";
import type { CategoryKey, IndexKey } from "./mf-catalog";

export type OverlapStock = {
  name: string;
  sector: string | null;
  /** how many of the ranked funds hold it */
  funds: number;
  avgWeight: number | null;
  /** weight per fund, keyed by scheme code */
  weights: Record<number, number | null>;
};

export type OverlapResult = {
  category: CategoryKey;
  indexLabel: string;
  start: string;
  end: string;
  funds: { code: number; name: string; rank: number; source: string | null; asOf: string | null }[];
  stocks: OverlapStock[];
  /** average pairwise weight overlap between the ranked funds, % */
  overlapPct: number | null;
  note: string | null;
};

/** "HDFC Bank Ltd." / "HDFC BANK LIMITED" -> "hdfc bank" */
export function normaliseStock(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(ltd|limited|ltd\.|plc|inc|corp|corporation|co|company|the)\b/g, " ")
    .replace(/[^a-z0-9& ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const pretty = (raw: string) => raw.replace(/\s+/g, " ").trim();

async function commonHoldingsUncached(input: {
  category: CategoryKey;
  indexKey: IndexKey;
  start: string;
  end: string;
  top?: number;
}): Promise<OverlapResult> {
  const result = await analyse({
    category: input.category,
    indexKey: input.indexKey,
    start: input.start,
    end: input.end,
  });
  const top = result.funds.filter((f) => f.eligible).slice(0, Math.max(2, input.top ?? 5));

  const loaded = await Promise.all(
    top.map(async (f, i) => {
      try {
        const h = await fetchHoldings({ schemeCode: f.code, fundName: f.name });
        return { fund: f, rank: i + 1, holdings: h };
      } catch {
        return { fund: f, rank: i + 1, holdings: null };
      }
    }),
  );

  const covered = loaded.filter((l) => (l.holdings?.holdings.length ?? 0) > 0);

  const bucket = new Map<
    string,
    { label: string; sector: string | null; weights: Record<number, number | null> }
  >();

  for (const entry of covered) {
    for (const h of entry.holdings!.holdings) {
      const key = normaliseStock(h.name);
      if (!key) continue;
      const row =
        bucket.get(key) ?? { label: pretty(h.name), sector: h.sector ?? null, weights: {} };
      row.weights[entry.fund.code] = h.weight ?? null;
      if (!row.sector && h.sector) row.sector = h.sector;
      bucket.set(key, row);
    }
  }

  const stocks: OverlapStock[] = [...bucket.values()]
    .map((row) => {
      const values = Object.values(row.weights).filter(
        (v): v is number => v != null && Number.isFinite(v),
      );
      return {
        name: row.label,
        sector: row.sector,
        funds: Object.keys(row.weights).length,
        avgWeight: values.length
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
          : null,
        weights: row.weights,
      };
    })
    .sort((a, b) => b.funds - a.funds || (b.avgWeight ?? 0) - (a.avgWeight ?? 0))
    .slice(0, 10);

  // pairwise overlap: sum of min(weight) across shared names, averaged over pairs
  let pairSum = 0;
  let pairs = 0;
  for (let i = 0; i < covered.length; i++) {
    for (let j = i + 1; j < covered.length; j++) {
      const a = new Map(
        covered[i]!.holdings!.holdings.map((h) => [normaliseStock(h.name), h.weight ?? 0]),
      );
      let shared = 0;
      for (const h of covered[j]!.holdings!.holdings) {
        const w = a.get(normaliseStock(h.name));
        if (w != null) shared += Math.min(w, h.weight ?? 0);
      }
      pairSum += shared;
      pairs += 1;
    }
  }

  return {
    category: input.category,
    indexLabel: result.indexLabel,
    start: result.start,
    end: result.end,
    funds: loaded.map((l) => ({
      code: l.fund.code,
      name: l.fund.name,
      rank: l.rank,
      source: l.holdings?.source ?? null,
      asOf: l.holdings?.asOf ?? null,
    })),
    stocks,
    overlapPct: pairs ? Math.round((pairSum / pairs) * 10) / 10 : null,
    note: covered.length < 2 ? "Published portfolios were unavailable for most of the ranked funds." : null,
  };
}

/** Overlap needs 5 holdings fetches; memoise per category window. */
export const commonHoldings = memoise(
  commonHoldingsUncached,
  (i: { category: CategoryKey; indexKey: IndexKey; start: string; end: string; top?: number }) =>
    `${i.category}|${i.indexKey}|${i.start}|${i.end}|${i.top ?? 5}`,
);
