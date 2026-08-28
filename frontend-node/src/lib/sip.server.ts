/**
 * SIP / lumpsum outcome engine.
 *
 * Everything here is measured from the NAV history already in the lake — no
 * assumed return rates. Three questions are answered for a ranked fund:
 *   1. what an investor actually earned inside the detected sideways window,
 *   2. how that window compares with every other window of the same length
 *      over the last five years (rolling median / best / worst),
 *   3. what happened to that investor 1, 2 and 3 years after past flat phases
 *      ended — versus the case where the market simply stayed flat.
 */

import { INDEXES, type CategoryKey, type IndexKey, type NavPoint } from "./mf-catalog";
import { analyse, detectSideways, fetchScheme } from "./mf.server";
import { memoise } from "./memo.server";

export type SipMode = "sip" | "lumpsum" | "both";

export type SipRun = {
  start: string;
  end: string;
  months: number;
  invested: number;
  value: number;
  gain: number;
  /** money-weighted annualised return (XIRR) in % */
  xirr: number | null;
  /** simple absolute return on the invested amount, % */
  absReturn: number;
};

export type SipScenario = {
  key: "sideways" | "y1" | "y2" | "y3";
  label: string;
  samples: number;
  medianXirr: number | null;
  bestXirr: number | null;
  worstXirr: number | null;
  positiveShare: number | null;
};

export type SipAnalysis = {
  code: number;
  name: string;
  mode: SipMode;
  amount: number;
  indexLabel: string;
  window: SipRun;
  benchmark: SipRun | null;
  rolling: {
    lengthDays: number;
    samples: number;
    medianXirr: number | null;
    bestXirr: number | null;
    worstXirr: number | null;
    positiveShare: number | null;
  } | null;
  scenarios: SipScenario[];
  note: string | null;
};

/* ------------------------------------------------------------------ maths */

type Flow = { t: number; amount: number };

const YEAR = 365 * 24 * 3600 * 1000;

function npv(flows: Flow[], rate: number, t0: number) {
  return flows.reduce((sum, f) => sum + f.amount / Math.pow(1 + rate, (f.t - t0) / YEAR), 0);
}

/** XIRR in %, null when the cash flows have no sign change or no solution. */
export function xirr(flows: Flow[]): number | null {
  if (flows.length < 2) return null;
  const t0 = flows[0]!.t;
  const hasIn = flows.some((f) => f.amount < 0);
  const hasOut = flows.some((f) => f.amount > 0);
  if (!hasIn || !hasOut) return null;

  // bisection is slower but never diverges — the ranges here are tiny
  let lo = -0.9999;
  let hi = 10;
  let flo = npv(flows, lo, t0);
  let fhi = npv(flows, hi, t0);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = npv(flows, mid, t0);
    if (Math.abs(fmid) < 1e-7) return mid * 100;
    if (flo * fmid < 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return ((lo + hi) / 2) * 100;
}

const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

function slice(points: NavPoint[], start: string, end: string) {
  return points.filter((p) => p.date >= start && p.date <= end);
}

/** first NAV on or after a date */
function navOn(points: NavPoint[], date: string): NavPoint | null {
  for (const p of points) if (p.date >= date) return p;
  return null;
}

function addMonths(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

/** Simulate one investment run and return the money-weighted outcome. */
export function simulate(
  points: NavPoint[],
  start: string,
  end: string,
  mode: SipMode,
  amount: number,
  lumpsum = 0,
): SipRun | null {
  const win = slice(points, start, end);
  if (win.length < 20) return null;
  const last = win[win.length - 1]!;
  const flows: Flow[] = [];
  let units = 0;
  let invested = 0;

  if (mode === "lumpsum" || mode === "both") {
    const first = win[0]!;
    const upfront = mode === "lumpsum" ? amount : lumpsum;
    if (upfront > 0) {
      units += upfront / first.nav;
      invested += upfront;
      flows.push({ t: ms(first.date), amount: -upfront });
    }
  }
  if (mode === "sip" || mode === "both") {
    let cursor = win[0]!.date;
    while (cursor <= end) {
      const pt = navOn(win, cursor);
      if (!pt || pt.date > end) break;
      units += amount / pt.nav;
      invested += amount;
      flows.push({ t: ms(pt.date), amount: -amount });
      cursor = addMonths(cursor, 1);
    }
  }
  if (invested <= 0) return null;
  flows.sort((a, b) => a.t - b.t);

  const value = units * last.nav;
  flows.push({ t: ms(last.date), amount: value });

  const months = Math.max(1, Math.round((ms(last.date) - ms(win[0]!.date)) / (YEAR / 12)));

  return {
    start: win[0]!.date,
    end: last.date,
    months,
    invested: Math.round(invested),
    value: Math.round(value),
    gain: Math.round(value - invested),
    xirr: xirr(flows),
    absReturn: (value / invested - 1) * 100,
  };
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

function stats(values: number[]) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) {
    return { samples: 0, medianXirr: null, bestXirr: null, worstXirr: null, positiveShare: null };
  }
  return {
    samples: clean.length,
    medianXirr: median(clean),
    bestXirr: Math.max(...clean),
    worstXirr: Math.min(...clean),
    positiveShare: (clean.filter((v) => v > 0).length / clean.length) * 100,
  };
}

/* ------------------------------------------------------------- public API */

export async function analyseSip(input: {
  code: number;
  indexKey: IndexKey;
  start: string;
  end: string;
  mode: SipMode;
  amount: number;
  /** upfront amount when mode is "both" */
  lumpsum?: number;
  /** rolling + post-sideways projections are the paid layer */
  deep: boolean;
}): Promise<SipAnalysis> {
  const idx = INDEXES.find((i) => i.key === input.indexKey)!;
  const [fund, index] = await Promise.all([fetchScheme(input.code), fetchScheme(idx.code)]);

  const window = simulate(
    fund.points,
    input.start,
    input.end,
    input.mode,
    input.amount,
    input.lumpsum ?? 0,
  );
  if (!window) throw new Error("Not enough NAV history for that fund in this window.");
  const benchmark = simulate(
    index.points,
    input.start,
    input.end,
    input.mode,
    input.amount,
    input.lumpsum ?? 0,
  );

  const result: SipAnalysis = {
    code: input.code,
    name: fund.meta.scheme_name,
    mode: input.mode,
    amount: input.amount,
    indexLabel: idx.label,
    window,
    benchmark,
    rolling: null,
    scenarios: [],
    note: null,
  };

  if (!input.deep) return result;

  /* ---- rolling windows of the same length across the last 5 years ---- */
  const lengthDays = Math.max(
    30,
    Math.round((ms(input.end) - ms(input.start)) / (24 * 3600 * 1000)),
  );
  const history = fund.points.filter((p) => ms(p.date) >= Date.now() - 5.5 * YEAR);
  const rollingXirrs: number[] = [];
  if (history.length > 60) {
    let cursor = history[0]!.date;
    const lastDate = history[history.length - 1]!.date;
    while (true) {
      const winEnd = new Date(ms(cursor) + lengthDays * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      if (winEnd > lastDate) break;
      const run = simulate(history, cursor, winEnd, input.mode, input.amount, input.lumpsum ?? 0);
      if (run?.xirr !== null && run?.xirr !== undefined) rollingXirrs.push(run.xirr);
      cursor = addMonths(cursor, 1);
    }
  }
  result.rolling = { lengthDays, ...stats(rollingXirrs) };

  /* ---- what happened 1 / 2 / 3 years after past flat phases ---- */
  const { windows } = await detectSideways(input.indexKey);
  const flat: number[] = [];
  const after: Record<"y1" | "y2" | "y3", number[]> = { y1: [], y2: [], y3: [] };
  const fundLast = fund.points[fund.points.length - 1]?.date ?? input.end;

  for (const w of windows) {
    const inside = simulate(
      fund.points,
      w.start,
      w.end,
      input.mode,
      input.amount,
      input.lumpsum ?? 0,
    );
    if (inside?.xirr != null) flat.push(inside.xirr);
    for (const [key, years] of [
      ["y1", 1],
      ["y2", 2],
      ["y3", 3],
    ] as const) {
      const end = addMonths(w.end, years * 12);
      if (end > fundLast) continue;
      // the investor keeps the SIP running (or stays invested) past the flat phase
      const run = simulate(fund.points, w.start, end, input.mode, input.amount, input.lumpsum ?? 0);
      if (run?.xirr != null) after[key].push(run.xirr);
    }
  }

  result.scenarios = [
    { key: "sideways" as const, label: "If the index stays sideways", values: flat },
    { key: "y1" as const, label: "1 year after the flat phase", values: after.y1 },
    { key: "y2" as const, label: "2 years after", values: after.y2 },
    { key: "y3" as const, label: "3 years after", values: after.y3 },
  ].map((s) => ({ key: s.key, label: s.label, ...stats(s.values) }));

  if (result.scenarios.every((s) => s.samples === 0)) {
    result.note = "This fund has no NAV history covering earlier flat phases of the index.";
  }

  return result;
}

/* --------------------------------------------------- category-wide plans */

export type CategorySipRow = {
  code: number;
  name: string;
  house: string;
  rank: number | null;
  eligible: boolean;
  invested: number;
  value: number;
  gain: number;
  xirr: number | null;
  absReturn: number;
};

export type CategorySipResult = {
  category: CategoryKey;
  categoryLabel: string;
  indexLabel: string;
  basis: "ranked" | "all";
  mode: SipMode;
  amount: number;
  lumpsum: number;
  start: string;
  end: string;
  rows: CategorySipRow[];
  benchmark: SipRun | null;
  summary: {
    funds: number;
    invested: number;
    medianXirr: number | null;
    bestXirr: number | null;
    worstXirr: number | null;
    avgValue: number | null;
    beatBenchmark: number;
  };
};

async function categorySipUncached(input: {
  category: CategoryKey;
  indexKey: IndexKey;
  start: string;
  end: string;
  mode: SipMode;
  amount: number;
  lumpsum: number;
  basis: "ranked" | "all";
  /** free tier only gets the ranked top slice */
  limit: number;
}): Promise<CategorySipResult> {
  const idx = INDEXES.find((i) => i.key === input.indexKey)!;
  const index = await fetchScheme(idx.code);
  const earliestBenchmarkDate = index.points[0]?.date;
  const latestBenchmarkDate = index.points[index.points.length - 1]?.date ?? input.end;

  if (!earliestBenchmarkDate) {
    throw new Error("Benchmark NAV history is temporarily unavailable. Please retry.");
  }
  const start = input.start < earliestBenchmarkDate ? earliestBenchmarkDate : input.start;
  const end = input.end > latestBenchmarkDate ? latestBenchmarkDate : input.end;

  const { readAnalysisSnapshot } = await import("./mf-snapshots.server");
  const snap = (await readAnalysisSnapshot(input.category, input.indexKey)) as any;
  let result: any = null;

  if (snap && snap.funds?.length > 0) {
    result = snap;
  } else {
    try {
      result = await analyse({
        category: input.category,
        indexKey: input.indexKey,
        start,
        end,
      });
    } catch {
      result = snap;
    }
  }

  const allFunds = result?.funds ?? [];
  const eligible = allFunds.filter((f: any) => f.eligible !== false);
  const pool = (input.basis === "ranked" ? eligible.slice(0, 5) : eligible).slice(0, input.limit);

  const benchmark = simulate(
    index.points,
    start,
    end,
    input.mode,
    input.amount,
    input.lumpsum,
  );

  const rows: CategorySipRow[] = [];
  const batch = 6;
  for (let i = 0; i < pool.length; i += batch) {
    const chunk = await Promise.all(
      pool.slice(i, i + batch).map(async (f: any) => {
        try {
          const scheme = await fetchScheme(f.code);
          const maxDate = scheme.points[scheme.points.length - 1]?.date ?? end;
          const fundEnd = end > maxDate ? maxDate : end;

          let run = simulate(
            scheme.points,
            start,
            fundEnd,
            input.mode,
            input.amount,
            input.lumpsum,
          );

          if (!run && scheme.points.length >= 20) {
            // Fallback: replay across all available points in this fund
            const firstPt = scheme.points[0]!.date;
            const fundStart = start < firstPt ? firstPt : start;
            run = simulate(
              scheme.points,
              fundStart,
              fundEnd,
              input.mode,
              input.amount,
              input.lumpsum,
            );
          }

          if (!run) return null;
          const rank = eligible.findIndex((e: any) => e.code === f.code);
          return {
            code: f.code,
            name: f.name,
            house: f.house,
            rank: rank >= 0 ? rank + 1 : null,
            eligible: true,
            invested: run.invested,
            value: run.value,
            gain: run.gain,
            xirr: run.xirr,
            absReturn: run.absReturn,
          } satisfies CategorySipRow;
        } catch {
          return null;
        }
      }),
    );
    for (const r of chunk) if (r) rows.push(r);
  }

  rows.sort((a, b) => (b.xirr ?? -Infinity) - (a.xirr ?? -Infinity));
  const xirrs = rows.map((r) => r.xirr).filter((v): v is number => v != null);
  const s = stats(xirrs);

  return {
    category: input.category,
    categoryLabel: result?.category ?? input.category,
    indexLabel: idx.label,
    basis: input.basis,
    mode: input.mode,
    amount: input.amount,
    lumpsum: input.lumpsum,
    start: result?.start ?? start,
    end: result?.end ?? end,
    rows,
    benchmark,
    summary: {
      funds: rows.length,
      invested: rows[0]?.invested ?? (input.mode === "lumpsum" ? input.lumpsum : input.amount),
      medianXirr: s.medianXirr,
      bestXirr: s.bestXirr,
      worstXirr: s.worstXirr,
      avgValue: rows.length ? Math.round(rows.reduce((a, b) => a + b.value, 0) / rows.length) : null,
      beatBenchmark: benchmark?.xirr != null ? rows.filter((r) => (r.xirr ?? -Infinity) > benchmark.xirr!).length : 0,
    },
  };
}

export const categorySip = memoise(
  categorySipUncached,
  (i) =>
    `${i.category}|${i.indexKey}|${i.start}|${i.end}|${i.mode}|${i.amount}|${i.lumpsum}|${i.basis}|${i.limit}`,
);
