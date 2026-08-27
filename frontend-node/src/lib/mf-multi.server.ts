import {
  DIP_BAND,
  INDEXES,
  type CategoryKey,
  type CombinedFund,
  type CombinedMetrics,
  type FundResult,
  type CombinedResult,
  type DipFund,
  type DipResult,
  type IndexKey,
} from "./mf-catalog";
import { analyse, detectSideways, fetchScheme } from "./mf.server";

/** how many recent sideways phases the combined view blends */
export const COMBINED_WINDOWS = 3;

const EMPTY_METRICS = (): CombinedMetrics => ({
  avgReturn: 0,
  avgMaxDrawdown: 0,
  avgVolatility: 0,
  avgUpDays: 0,
  avgBeta: 0,
  sharpe: null,
  sortino: null,
  treynor: null,
  consistency: 0,
  upCapture: 0,
  downCapture: 0,
  drawdownReturn: 0,
  benchDrawdownReturn: 0,
  cagr3y: null,
  cagr5y: null,
  ratioBasis: "",
});

/**
 * Window-level figures (return, drawdown, volatility) are averaged across the
 * phases a fund qualified in; trailing ratios are point-in-time, so they come
 * from the most recent qualifying phase.
 */
function blendMetrics(rows: { start: string; f: FundResult }[]): CombinedMetrics {
  if (!rows.length) return EMPTY_METRICS();
  const sorted = [...rows].sort((a, b) => b.start.localeCompare(a.start));
  const latest = sorted[0]!.f;
  const mean = (pick: (f: FundResult) => number) =>
    sorted.reduce((a, r) => a + (pick(r.f) || 0), 0) / sorted.length;
  return {
    avgReturn: mean((f) => f.return),
    avgMaxDrawdown: mean((f) => f.maxDrawdown),
    avgVolatility: mean((f) => f.volatility),
    avgUpDays: mean((f) => f.upDays),
    avgBeta: mean((f) => f.beta),
    sharpe: latest.sharpe,
    sortino: latest.sortino,
    treynor: latest.treynor,
    consistency: latest.consistency,
    upCapture: latest.upCapture,
    downCapture: latest.downCapture,
    drawdownReturn: latest.drawdownReturn,
    benchDrawdownReturn: latest.benchDrawdownReturn,
    cagr3y: latest.cagr3y,
    cagr5y: latest.cagr5y,
    ratioBasis: latest.ratioBasis,
  };
}

/**
 * Rank funds across the last three sideways phases instead of a single window.
 * Each phase is scored with the normal engine; a fund's combined score is its
 * average phase score scaled by how many of the phases it actually cleared,
 * so a fund that only shows up once cannot outrank a consistent performer.
 */
export async function analyseCombined(input: {
  category: CategoryKey;
  indexKey: IndexKey;
}): Promise<CombinedResult> {
  const idx = INDEXES.find((i) => i.key === input.indexKey)!;
  const { windows } = await detectSideways(input.indexKey);
  const picked = windows.slice(0, COMBINED_WINDOWS);
  if (picked.length === 0) {
    return {
      category: input.category,
      indexKey: input.indexKey,
      indexLabel: idx.label,
      windows: [],
      funds: [],
    };
  }

  // Windows are independent — run them together instead of one after another.
  const settled = await Promise.all(
    picked.map((w) =>
      analyse({
        category: input.category,
        indexKey: input.indexKey,
        start: w.start,
        end: w.end,
      }).catch(() => null),
    ),
  );
  const results = settled.filter((r): r is NonNullable<typeof r> => r !== null);

  const merged = new Map<number, CombinedFund>();
  /** every per-phase metric row for a fund, newest phase first */
  const samples = new Map<number, { start: string; f: (typeof results)[number]["funds"][number] }[]>();
  for (const res of results) {
    const eligible = res.funds.filter((f) => f.eligible);
    eligible.forEach((f, i) => {
      samples.set(f.code, [...(samples.get(f.code) ?? []), { start: res.start, f }]);
      const entry = merged.get(f.code) ?? {
        code: f.code,
        name: f.name,
        house: f.house,
        aumCrore: f.aumCrore,
        sizeBucket: f.sizeBucket,
        styleBucket: f.styleBucket,
        appearances: 0,
        avgScore: 0,
        avgAlpha: 0,
        bestRank: Number.MAX_SAFE_INTEGER,
        worstRank: 0,
        combinedScore: 0,
        windows: [] as CombinedFund["windows"],
        metrics: EMPTY_METRICS(),
      } satisfies CombinedFund;
      entry.aumCrore = f.aumCrore ?? entry.aumCrore;
      entry.appearances += 1;
      entry.bestRank = Math.min(entry.bestRank, i + 1);
      entry.worstRank = Math.max(entry.worstRank, i + 1);
      entry.windows.push({
        start: res.start,
        end: res.end,
        rank: i + 1,
        score: f.score,
        alpha: f.alpha,
        return: f.return,
      });
      merged.set(f.code, entry);
    });
  }

  const phases = results.length || 1;
  const funds = [...merged.values()].map((f) => {
    const avgScore = f.windows.reduce((a, b) => a + b.score, 0) / f.windows.length;
    const avgAlpha = f.windows.reduce((a, b) => a + b.alpha, 0) / f.windows.length;
    return {
      ...f,
      avgScore,
      avgAlpha,
      combinedScore: avgScore * (f.appearances / phases),
      windows: f.windows.sort((a, b) => b.start.localeCompare(a.start)),
      metrics: blendMetrics(samples.get(f.code) ?? []),
    };
  });
  funds.sort((a, b) => b.combinedScore - a.combinedScore);

  return {
    category: input.category,
    indexKey: input.indexKey,
    indexLabel: idx.label,
    windows: results.map((r) => ({
      start: r.start,
      end: r.end,
      days: r.window.days,
      drift: r.window.drift,
      band: r.window.band,
    })),
    funds,
  };
}

/**
 * Top-rated funds from the most recent sideways phase that are currently
 * trading 5–10% below their 1-year NAV peak — quality names on a shallow dip.
 */
export async function scanDips(input: {
  category: CategoryKey;
  indexKey: IndexKey;
  limit?: number;
}): Promise<DipResult> {
  const idx = INDEXES.find((i) => i.key === input.indexKey)!;
  const { windows } = await detectSideways(input.indexKey);
  const latest = windows[0];
  if (!latest) {
    return {
      category: input.category,
      indexKey: input.indexKey,
      indexLabel: idx.label,
      window: { start: "", end: "" },
      asOf: "",
      band: DIP_BAND,
      scanned: 0,
      funds: [],
    };
  }

  const res = await analyse({
    category: input.category,
    indexKey: input.indexKey,
    start: latest.start,
    end: latest.end,
  });
  const ranked = res.funds.filter((f) => f.eligible);

  const scanned = ranked.slice(0, 40);
  const navs = await Promise.all(
    scanned.map(async (f) => {
      try {
        return { code: f.code, points: (await fetchScheme(f.code)).points };
      } catch {
        return { code: f.code, points: [] };
      }
    }),
  );
  const navByCode = new Map(navs.map((n) => [n.code, n.points]));

  const out: DipFund[] = [];
  let asOf = "";
  for (const [i, f] of scanned.entries()) {
    const points = navByCode.get(f.code) ?? [];
    const last = points[points.length - 1];
    if (!last) continue;
    const from = new Date(Date.parse(`${last.date}T00:00:00Z`) - 365 * 86400000)
      .toISOString()
      .slice(0, 10);
    let peak = { date: last.date, nav: 0 };
    for (const p of points) {
      if (p.date < from) continue;
      if (p.nav > peak.nav) peak = { date: p.date, nav: p.nav };
    }
    if (peak.nav <= 0) continue;
    const dip = (1 - last.nav / peak.nav) * 100;
    if (asOf < last.date) asOf = last.date;
    if (dip < DIP_BAND.min || dip > DIP_BAND.max) continue;
    out.push({
      code: f.code,
      name: f.name,
      house: f.house,
      aumCrore: f.aumCrore,
      rank: i + 1,
      score: f.score,
      alpha: f.alpha,
      sharpe: f.sharpe,
      cagr3y: f.cagr3y,
      peakDate: peak.date,
      peakNav: peak.nav,
      latestDate: last.date,
      latestNav: last.nav,
      dipPct: dip,
    });
  }

  out.sort((a, b) => a.rank - b.rank);

  return {
    category: input.category,
    indexKey: input.indexKey,
    indexLabel: idx.label,
    window: { start: res.start, end: res.end },
    asOf,
    band: DIP_BAND,
    scanned: scanned.length,
    funds: out.slice(0, input.limit ?? 10),
  };
}
