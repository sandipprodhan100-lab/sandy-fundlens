import {
  CATEGORIES,
  INDEXES,
  RISK_FREE,
  SIDEWAYS_RULE,
  SERIES_KEYS,
  TOP_N,
  toISO,
  type AnalysisResult,
  type CategoryKey,
  type FundResult,
  type IndexKey,
  type NavPoint,
  type SeriesPoint,
  type SidewaysWindow,
  type SizeBucket,
  type StyleBucket,
} from "./mf-catalog";
import { memoise } from "./memo.server";
import { lakeCategoryCodes, readNavParquet, schemeMetaIndex } from "./nav-parquet.server";


const BASE = "https://api.mfapi.in";
const TTL = 1000 * 60 * 60 * 6;

/** eligibility screens applied before a fund can be ranked */
export const MIN_AGE_YEARS = 3;
export const MIN_AUM_SHARE = 0.15;

type Scheme = { meta: { fund_house: string; scheme_name: string; scheme_category: string }; points: NavPoint[] };

const schemeCache = new Map<number, { at: number; value: Scheme }>();
const searchCache = new Map<string, { at: number; value: { schemeCode: number; schemeName: string }[] }>();

async function getJSON(url: string, attempts = 5) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 600 * 2 ** i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Upstream request failed");
}

const inflight = new Map<number, Promise<Scheme>>();

export async function fetchScheme(code: number): Promise<Scheme> {
  const hit = schemeCache.get(code);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const running = inflight.get(code);
  if (running) return running;
  const task = (async () => {
    // In-house first: the S3 Parquet lake is the system of record for NAV history.
    const [lake, meta] = await Promise.all([
      readNavParquet(code).catch(() => [] as NavPoint[]),
      schemeMetaIndex()
        .then((m) => m.get(code))
        .catch(() => undefined),
    ]);

    if (lake.length > 100 && meta) {
      const value: Scheme = {
        meta: {
          fund_house: meta.fundHouse,
          scheme_name: meta.schemeName,
          scheme_category: meta.schemeCategory ?? "",
        },
        points: lake,
      };
      schemeCache.set(code, { at: Date.now(), value });
      return value;
    }

    // Not migrated yet (or metadata missing) -> fall back to the public NAV feed.
    let raw: { meta: Scheme["meta"]; data: { date: string; nav: string }[] };
    try {
      raw = (await getJSON(`${BASE}/mf/${code}`)) as typeof raw;
    } catch (err) {
      if (hit) return hit.value; // serve stale on upstream failure
      if (lake.length > 100) {
        const value: Scheme = {
          meta: {
            fund_house: meta?.fundHouse ?? "",
            scheme_name: meta?.schemeName ?? `Scheme ${code}`,
            scheme_category: meta?.schemeCategory ?? "",
          },
          points: lake,
        };
        schemeCache.set(code, { at: Date.now(), value });
        return value;
      }
      throw err;
    }
    const apiPoints = (raw.data ?? [])
      .map((d) => ({ date: toISO(d.date), nav: Number(d.nav) }))
      .filter((p) => Number.isFinite(p.nav) && p.nav > 0)
      .reverse();
    // Lake rows win on overlapping dates; the daily feed tops up the recent tail.
    const merged = lake.length
      ? [...new Map([...apiPoints, ...lake].map((p) => [p.date, p])).values()].sort((a, b) =>
          a.date.localeCompare(b.date),
        )
      : apiPoints;
    const value: Scheme = { meta: raw.meta, points: merged };
    schemeCache.set(code, { at: Date.now(), value });
    return value;
  })().finally(() => inflight.delete(code));
  inflight.set(code, task);
  return task;
}

async function fetchSchemeWithFallback(codes: number[]): Promise<Scheme> {
  let lastErr: unknown;
  for (const code of codes) {
    try {
      const s = await fetchScheme(code);
      if (s.points.length > 100) return s;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Index data is temporarily unavailable from the NAV provider. Please retry.");
}


async function fetchDirectory() {
  const hit = searchCache.get("__all__");
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  try {
    const value = (await getJSON(`${BASE}/mf`)) as { schemeCode: number; schemeName: string }[];
    searchCache.set("__all__", { at: Date.now(), value });
    return value;
  } catch (err) {
    if (hit) return hit.value;
    throw err;
  }
}

/** One direct-growth scheme per fund house for a category (shared by analysis and S3 ingest). */
export async function categoryCandidates(
  category: CategoryKey,
  limit = 120,
  source: "auto" | "directory" = "auto",
): Promise<number[]> {
  const cat = CATEGORIES.find((c) => c.key === category)!;
  if (source === "auto") {
    // In-house lake wins: once a category is migrated we never hit the public directory.
    const migrated = await lakeCategoryCodes(category).catch(() => [] as number[]);
    if (migrated.length >= 10) return migrated.slice(0, limit);
  }
  const raw = await fetchDirectory();
  const seen = new Set<string>();
  const candidates: number[] = [];
  const terms = cat.query.toLowerCase().split("|");
  for (const s of raw) {
    const name = s.schemeName;
    if (!terms.some((t) => name.toLowerCase().includes(t))) continue;
    if (!/direct/i.test(name) || !/growth/i.test(name)) continue;
    if (/idcw|dividend|bonus|payout|index|etf|fund of fund|\bfof\b/i.test(name)) continue;
    const house = name.toLowerCase().split(" fund")[0]!.trim();
    if (seen.has(house)) continue;
    seen.add(house);
    candidates.push(s.schemeCode);
    if (candidates.length >= limit) break;
  }
  return candidates;
}


function slice(points: NavPoint[], start: string, end: string) {
  return points.filter((p) => p.date >= start && p.date <= end);
}

function metrics(win: NavPoint[]) {
  const first = win[0]!.nav;
  const last = win[win.length - 1]!.nav;
  const ret = (last / first - 1) * 100;
  const days = Math.max(
    1,
    (Date.parse(win[win.length - 1]!.date) - Date.parse(win[0]!.date)) / 86400000,
  );
  const annualised = ((last / first) ** (365 / days) - 1) * 100;
  let peak = first;
  let maxDD = 0;
  const rets: number[] = [];
  for (let i = 0; i < win.length; i++) {
    const nav = win[i]!.nav;
    peak = Math.max(peak, nav);
    maxDD = Math.max(maxDD, (peak - nav) / peak);
    if (i > 0) rets.push(nav / win[i - 1]!.nav - 1);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / Math.max(1, rets.length);
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  const upDays = (rets.filter((r) => r > 0).length / Math.max(1, rets.length)) * 100;
  return { ret, annualised, maxDD: maxDD * 100, volatility, upDays, days };
}

/** point-in-time NAV at or just before an ISO date */
function navAsOf(points: NavPoint[], iso: string) {
  let found: NavPoint | null = null;
  for (const p of points) {
    if (p.date > iso) break;
    found = p;
  }
  return found;
}

/** trailing compound annual growth rate over `years`, ending at `asOf` */
function trailingCagr(points: NavPoint[], asOf: string, years: number): number | null {
  const end = navAsOf(points, asOf);
  if (!end) return null;
  const startISO = new Date(Date.parse(`${asOf}T00:00:00Z`) - years * 365.25 * 86400000)
    .toISOString()
    .slice(0, 10);
  const start = navAsOf(points, startISO);
  if (!start) return null;
  const elapsed = (Date.parse(end.date) - Date.parse(start.date)) / 86400000;
  // require at least 90% of the requested span so a young fund is not overstated
  if (elapsed < years * 365.25 * 0.9) return null;
  return ((end.nav / start.nav) ** (365.25 / elapsed) - 1) * 100;
}

function sinceInceptionCagr(points: NavPoint[], asOf: string): number | null {
  const end = navAsOf(points, asOf);
  const start = points[0];
  if (!end || !start) return null;
  const elapsed = (Date.parse(end.date) - Date.parse(start.date)) / 86400000;
  if (elapsed < 365) return null;
  return ((end.nav / start.nav) ** (365.25 / elapsed) - 1) * 100;
}

async function detectSidewaysUncached(indexKey: IndexKey): Promise<{
  windows: SidewaysWindow[];
  series: { date: string; value: number }[];
  first: string;
  last: string;
}> {
  const def = INDEXES.find((i) => i.key === indexKey)!;
  const { points } = await fetchSchemeWithFallback([def.code, ...(def.fallbacks ?? [])]);
  const found: { i: number; j: number; drift: number; band: number }[] = [];
  const n = points.length;
  for (let i = 0; i < n; i += 5) {
    let hi = points[i]!.nav;
    let lo = points[i]!.nav;
    let j = i;
    while (j + 1 < n) {
      const nav = points[j + 1]!.nav;
      const nhi = Math.max(hi, nav);
      const nlo = Math.min(lo, nav);
      if ((nhi - nlo) / nlo > 0.1) break;
      hi = nhi;
      lo = nlo;
      j++;
    }
    const days = (Date.parse(points[j]!.date) - Date.parse(points[i]!.date)) / 86400000;
    const drift = (points[j]!.nav / points[i]!.nav - 1) * 100;
    if (days >= 90 && Math.abs(drift) <= 5) found.push({ i, j, drift, band: ((hi - lo) / lo) * 100 });
  }
  found.sort((a, b) => b.j - b.i - (a.j - a.i));
  const picked: typeof found = [];
  for (const w of found) {
    if (picked.some((p) => Math.min(p.j, w.j) - Math.max(p.i, w.i) > 0)) continue;
    picked.push(w);
    if (picked.length === 5) break;
  }
  picked.sort((a, b) => b.i - a.i);
  const windows = picked.map((w) => ({
    start: points[w.i]!.date,
    end: points[w.j]!.date,
    days: Math.round((Date.parse(points[w.j]!.date) - Date.parse(points[w.i]!.date)) / 86400000),
    drift: w.drift,
    band: w.band,
  }));
  const step = Math.max(1, Math.floor(points.length / 260));
  const series = points.filter((_, idx) => idx % step === 0).map((p) => ({ date: p.date, value: p.nav }));
  return { windows, series, first: points[0]?.date ?? "", last: points[points.length - 1]?.date ?? "" };
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
  const out: R[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (cursor < items.length) {
        const idx = cursor++;
        try {
          out.push(await fn(items[idx]!));
        } catch {
          /* skip unavailable scheme */
        }
      }
    }),
  );
  return out;
}

/** daily simple returns keyed by date, restricted to [from, to] */
function returnMap(points: NavPoint[], from: string, to: string) {
  const win = slice(points, from, to);
  const map = new Map<string, number>();
  for (let i = 1; i < win.length; i++) {
    map.set(win[i]!.date, win[i]!.nav / win[i - 1]!.nav - 1);
  }
  return map;
}

function align(a: Map<string, number>, b: Map<string, number>) {
  const x: number[] = [];
  const y: number[] = [];
  for (const [date, va] of a) {
    const vb = b.get(date);
    if (vb === undefined) continue;
    x.push(va);
    y.push(vb);
  }
  return { x, y };
}

function correlation(x: number[], y: number[]) {
  const n = x.length;
  if (n < 30) return 0;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - mx;
    const dy = y[i]! - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  if (vx === 0 || vy === 0) return 0;
  return cov / Math.sqrt(vx * vy);
}

function betaAndCapture(fund: number[], index: number[]) {
  const n = fund.length;
  if (n < 30) return { beta: 1, upCapture: 1, downCapture: 1 };
  const mf = fund.reduce((s, v) => s + v, 0) / n;
  const mi = index.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let vi = 0;
  let upF = 0;
  let upI = 0;
  let downF = 0;
  let downI = 0;
  for (let i = 0; i < n; i++) {
    cov += (fund[i]! - mf) * (index[i]! - mi);
    vi += (index[i]! - mi) ** 2;
    if (index[i]! > 0) {
      upF += fund[i]!;
      upI += index[i]!;
    } else if (index[i]! < 0) {
      downF += fund[i]!;
      downI += index[i]!;
    }
  }
  return {
    beta: vi === 0 ? 1 : cov / vi,
    upCapture: upI === 0 ? 1 : upF / upI,
    downCapture: downI === 0 ? 1 : downF / downI,
  };
}

/** persistence of 6-month trailing returns → next 3-month returns */
function momentumScore(points: NavPoint[], from: string, to: string) {
  const win = slice(points, from, to);
  if (win.length < 300) return 0;
  const past: number[] = [];
  const future: number[] = [];
  const lookback = 126;
  const forward = 63;
  for (let i = lookback; i + forward < win.length; i += 5) {
    past.push(win[i]!.nav / win[i - lookback]!.nav - 1);
    future.push(win[i + forward]!.nav / win[i]!.nav - 1);
  }
  return correlation(past, future);
}

function tiltOf(input: { beta: number; upCapture: number; downCapture: number }) {
  return input.upCapture - input.downCapture + (input.beta - 1);
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/** peer-relative classification so the grid actually spreads across columns */
function classifyStyle(
  fund: { tilt: number; momentum: number; beta: number },
  peers: { tiltMedian: number; momentumMedian: number },
): StyleBucket {
  if (fund.momentum >= 0.2 && fund.momentum >= peers.momentumMedian && fund.beta >= 0.95)
    return "momentum";
  return fund.tilt >= peers.tiltMedian ? "growth" : "value";
}

/**
 * Risk-adjusted ratios + drawdown behaviour.
 * Sharpe/Sortino use the fund's own uninterrupted daily series (the index proxy publishes
 * fewer NAV days, so aligning first would silently drop a third of the fund's return).
 * Down-market behaviour is measured interval-by-interval against the index's own points.
 */
function riskRatios(fundPoints: NavPoint[], indexPoints: NavPoint[], beta: number, from: string, to: string) {
  const fw = slice(fundPoints, from, to);
  const iw = slice(indexPoints, from, to);
  const empty = {
    sharpe: null as number | null,
    sortino: null as number | null,
    treynor: null as number | null,
    drawdownReturn: 0,
    benchDrawdownReturn: 0,
    consistency: 0,
  };
  if (fw.length < 250 || iw.length < 100) return empty;

  const rets: number[] = [];
  for (let i = 1; i < fw.length; i++) rets.push(fw[i]!.nav / fw[i - 1]!.nav - 1);
  const n = rets.length;
  const spanDays = (Date.parse(fw[n]!.date) - Date.parse(fw[0]!.date)) / 86400000;
  const cagr = ((fw[n]!.nav / fw[0]!.nav) ** (365.25 / Math.max(1, spanDays)) - 1) * 100;

  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const vol = Math.sqrt(variance) * Math.sqrt(252) * 100;

  const dailyMar = (1 + RISK_FREE / 100) ** (1 / 252) - 1;
  const downs = rets.filter((r) => r < dailyMar).map((r) => (r - dailyMar) ** 2);
  const downside = Math.sqrt(downs.reduce((a, b) => a + b, 0) / (n - 1)) * Math.sqrt(252) * 100;

  const excess = cagr - RISK_FREE;

  // compound fund + index returns over every interval in which the index fell
  let fundDown = 1;
  let benchDown = 1;
  for (let i = 1; i < iw.length; i++) {
    const idxRet = iw[i]!.nav / iw[i - 1]!.nav - 1;
    if (idxRet >= 0) continue;
    const a = navAsOf(fw, iw[i - 1]!.date);
    const b = navAsOf(fw, iw[i]!.date);
    if (!a || !b || a.date === b.date) continue;
    fundDown *= b.nav / a.nav;
    benchDown *= 1 + idxRet;
  }

  // rolling 3-month windows: does the fund beat the index over the same dates?
  let wins = 0;
  let total = 0;
  const span = 63;
  for (let i = 0; i + span < fw.length; i += 5) {
    const sIdx = navAsOf(iw, fw[i]!.date);
    const eIdx = navAsOf(iw, fw[i + span]!.date);
    if (!sIdx || !eIdx || sIdx.date === eIdx.date) continue;
    total++;
    if (fw[i + span]!.nav / fw[i]!.nav > eIdx.nav / sIdx.nav) wins++;
  }

  return {
    sharpe: vol > 0 ? excess / vol : null,
    sortino: downside > 0 ? excess / downside : null,
    treynor: Math.abs(beta) > 0.1 ? excess / beta : null,
    drawdownReturn: (fundDown - 1) * 100,
    benchDrawdownReturn: (benchDown - 1) * 100,
    consistency: total > 0 ? (wins / total) * 100 : 0,
  };
}


/** 0..1 percentile of each value inside its own cross-section */
function percentiles(values: (number | null)[]) {
  const valid = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  return values.map((v) => {
    if (v === null || valid.length < 2) return 0.5;
    const below = valid.filter((x) => x < v).length;
    return below / (valid.length - 1);
  });
}

const RANK_WEIGHTS: Record<
  CategoryKey,
  { alpha: number; sharpe: number; sortino: number; treynor: number; drawdown: number; consistency: number; maxDD: number }
> = {
  large: { alpha: 0.2, sharpe: 0.15, sortino: 0.1, treynor: 0.25, drawdown: 0.1, consistency: 0.15, maxDD: 0.05 },
  mid: { alpha: 0.2, sharpe: 0.1, sortino: 0.25, treynor: 0.05, drawdown: 0.2, consistency: 0.1, maxDD: 0.1 },
  small: { alpha: 0.15, sharpe: 0.1, sortino: 0.25, treynor: 0.05, drawdown: 0.2, consistency: 0.1, maxDD: 0.15 },
  multi: { alpha: 0.2, sharpe: 0.25, sortino: 0.15, treynor: 0.05, drawdown: 0.1, consistency: 0.2, maxDD: 0.05 },
  flexi: { alpha: 0.2, sharpe: 0.25, sortino: 0.15, treynor: 0.05, drawdown: 0.1, consistency: 0.2, maxDD: 0.05 },
  hybrid: { alpha: 0.15, sharpe: 0.3, sortino: 0.15, treynor: 0.05, drawdown: 0.2, consistency: 0.1, maxDD: 0.05 },
};


const SIZE_PROXIES: { bucket: SizeBucket; key: IndexKey }[] = [
  { bucket: "large", key: "nifty50" },
  { bucket: "mid", key: "midcap150" },
  { bucket: "small", key: "smallcap250" },
];

async function analyseUncached(input: {
  category: CategoryKey;
  indexKey: IndexKey;
  start: string;
  end: string;
}): Promise<AnalysisResult> {
  const cat = CATEGORIES.find((c) => c.key === input.category)!;
  const idx = INDEXES.find((i) => i.key === input.indexKey)!;

  const indexScheme = await fetchScheme(idx.code);
  const indexWin = slice(indexScheme.points, input.start, input.end);
  if (indexWin.length < 10) throw new Error("Not enough index history for that period.");
  const indexStats = metrics(indexWin);

  let hi = indexWin[0]!.nav;
  let lo = indexWin[0]!.nav;
  for (const p of indexWin) {
    hi = Math.max(hi, p.nav);
    lo = Math.min(lo, p.nav);
  }
  const windowBand = ((hi - lo) / lo) * 100;
  const windowDays = Math.round(
    (Date.parse(indexWin[indexWin.length - 1]!.date) - Date.parse(indexWin[0]!.date)) / 86400000,
  );

  const candidates = await categoryCandidates(input.category);


  const fetched = await pool(candidates, 10, async (code) => ({ code, scheme: await fetchScheme(code) }));

  // trailing 3-year window ending at the analysis end date, for style/size scoring
  const styleEnd = input.end;
  const styleStart = new Date(Date.parse(`${input.end}T00:00:00Z`) - 3 * 365 * 86400000)
    .toISOString()
    .slice(0, 10);

  const needsSizeInference = input.category === "multi" || input.category === "flexi" || input.category === "hybrid";
  const proxyReturns = new Map<SizeBucket, Map<string, number>>();
  for (const proxy of SIZE_PROXIES) {
    const def = INDEXES.find((i) => i.key === proxy.key)!;
    try {
      const scheme = await fetchSchemeWithFallback([def.code, ...(def.fallbacks ?? [])]);
      proxyReturns.set(proxy.bucket, returnMap(scheme.points, styleStart, styleEnd));
    } catch {
      /* proxy unavailable */
    }
  }
  const styleIndexReturns = returnMap(indexScheme.points, styleStart, styleEnd);

  const staticSize: SizeBucket =
    input.category === "mid" ? "mid" : input.category === "small" ? "small" : "large";

  // The lake's scheme metadata often has no SEBI category string, so fall back to the
  // category's name terms (the same terms the candidate list was built from), minus the
  // neighbouring categories those terms would otherwise drag in.
  const nameTerms = cat.query.toLowerCase().split("|").map((t) => t.trim()).filter(Boolean);
  const NAME_EXCLUDE: Record<string, RegExp> = {
    large: /mid cap|small cap|multi cap|flexi/,
    mid: /large & mid|large and mid|small cap|multi cap|flexi/,
    small: /large|mid cap|multi cap|flexi/,
    multi: /flexi|large & mid/,
    flexi: /multi cap/,
    hybrid: /conservative|arbitrage|equity savings|balanced advantage|dynamic asset|multi asset|debt hybrid/,
  };
  const exclude = NAME_EXCLUDE[input.category];
  const inCategory = (scheme: Scheme) => {
    const category = (scheme.meta?.scheme_category ?? "").toLowerCase();
    const name = (scheme.meta?.scheme_name ?? "").toLowerCase();
    if (exclude?.test(name) || exclude?.test(category)) return false;
    if (category.includes(cat.categoryMatch)) return true;
    return nameTerms.some((t) => name.includes(t));
  };


  const funds: (FundResult & { win: NavPoint[] })[] = [];
  for (const { code, scheme } of fetched) {
    const category = scheme.meta?.scheme_category ?? "";
    if (!inCategory(scheme)) continue;

    const win = slice(scheme.points, input.start, input.end);
    if (win.length < Math.max(10, indexWin.length * 0.8)) continue;
    const m = metrics(win);

    const fundRets = returnMap(scheme.points, styleStart, styleEnd);
    const paired = align(fundRets, styleIndexReturns);
    const cap = betaAndCapture(paired.x, paired.y);
    const mom = momentumScore(scheme.points, styleStart, styleEnd);
    const rr = riskRatios(scheme.points, indexScheme.points, cap.beta, styleStart, styleEnd);
    const tilt = tiltOf(cap);

    let sizeBucket = staticSize;
    let sizeBasis = `Official category: ${category}`;
    if (needsSizeInference) {
      let best = -2;
      for (const [bucket, rets] of proxyReturns) {
        const p = align(fundRets, rets);
        const c = correlation(p.x, p.y);
        if (c > best) {
          best = c;
          sizeBucket = bucket;
        }
      }
      sizeBasis = `NAV correlation with size indices (${best.toFixed(2)})`;
    }

    funds.push({
      code,
      name: scheme.meta.scheme_name,
      house: scheme.meta.fund_house,
      category,
      return: m.ret,
      annualised: m.annualised,
      alpha: m.ret - indexStats.ret,
      maxDrawdown: m.maxDD,
      volatility: m.volatility,
      upDays: m.upDays,
      score: 0,
      sizeBucket,
      styleBucket: "value",
      beta: cap.beta,
      upCapture: cap.upCapture,
      downCapture: cap.downCapture,
      tilt,
      momentum: mom,
      sizeBasis,
      cagr1y: trailingCagr(scheme.points, input.end, 1),
      cagr3y: trailingCagr(scheme.points, input.end, 3),
      cagr5y: trailingCagr(scheme.points, input.end, 5),
      cagr10y: trailingCagr(scheme.points, input.end, 10),
      cagrSince: sinceInceptionCagr(scheme.points, input.end),
      cagrAsOf: input.end,
      ...rr,
      ratioBasis: `Trailing 3Y daily NAV to ${input.end}, risk-free ${RISK_FREE}%`,
      aumCrore: null,
      aumVsAvg: null,
      flowQ1: null,
      flowQ2: null,
      flowNote: null,
      inception: scheme.points[0]?.date ?? input.start,
      ageYears:
        (Date.parse(`${input.end}T00:00:00Z`) -
          Date.parse(`${scheme.points[0]?.date ?? input.end}T00:00:00Z`)) /
        (365.25 * 86400000),
      eligible: true,
      ineligibleReason: null,
      win,
    });
  }

  // fund size + quarterly net flows, then the age / size screens used for ranking
  const { fetchAumMap, syncQuarterlyFlows } = await import("./aum.server");
  const aumMap = await fetchAumMap(funds.map((f) => ({ code: f.code, name: f.name })));
  for (const f of funds) f.aumCrore = aumMap.get(f.code)?.aumCrore ?? null;

  const knownAum = funds.map((f) => f.aumCrore).filter((v): v is number => v !== null);
  const aumAvg = knownAum.length ? knownAum.reduce((a, b) => a + b, 0) / knownAum.length : null;
  const aumFloor = aumAvg === null ? null : aumAvg * MIN_AUM_SHARE;
  for (const f of funds) f.aumVsAvg = f.aumCrore !== null && aumAvg ? f.aumCrore / aumAvg : null;

  const flows = await syncQuarterlyFlows(
    funds.map((f) => ({
      code: f.code,
      aumCrore: f.aumCrore,
      nav: f.win[f.win.length - 1]?.nav ?? 0,
      asOf: input.end,
    })),
  );
  for (const f of funds) {
    const flow = flows.get(f.code);
    f.flowQ1 = flow?.flowQ1 ?? null;
    f.flowQ2 = flow?.flowQ2 ?? null;
    f.flowNote = flow?.flowNote ?? null;

    if (f.ageYears < MIN_AGE_YEARS) {
      f.eligible = false;
      f.ineligibleReason = `Only ${f.ageYears.toFixed(1)}y old — needs ${MIN_AGE_YEARS}y history`;
    } else if (f.aumCrore === null) {
      f.eligible = false;
      f.ineligibleReason = "Fund size not published by the data source";
    } else if (aumFloor !== null && f.aumCrore < aumFloor) {
      f.eligible = false;
      f.ineligibleReason = `Fund size below ${Math.round(MIN_AUM_SHARE * 100)}% of the ₹${Math.round(
        aumAvg!,
      ).toLocaleString("en-IN")} cr category average`;
    }
  }


  const peers = {
    tiltMedian: median(funds.map((f) => f.tilt)),
    momentumMedian: median(funds.map((f) => f.momentum)),
  };
  for (const f of funds) f.styleBucket = classifyStyle(f, peers);

  // composite ranking: window alpha + risk-adjusted ratios + behaviour in falling markets.
  // only funds clearing the age + fund-size screens are scored; the rest are listed unranked.
  const w = RANK_WEIGHTS[input.category];
  const ranked = funds.filter((f) => f.eligible);
  const pAlpha = percentiles(ranked.map((f) => f.alpha));
  const pSharpe = percentiles(ranked.map((f) => f.sharpe));
  const pSortino = percentiles(ranked.map((f) => f.sortino));
  const pTreynor = percentiles(ranked.map((f) => f.treynor));
  const pDD = percentiles(ranked.map((f) => f.drawdownReturn));
  const pCons = percentiles(ranked.map((f) => f.consistency));
  const pMaxDD = percentiles(ranked.map((f) => -f.maxDrawdown));
  ranked.forEach((f, i) => {
    f.score =
      100 *
      (w.alpha * pAlpha[i]! +
        w.sharpe * pSharpe[i]! +
        w.sortino * pSortino[i]! +
        w.treynor * pTreynor[i]! +
        w.drawdown * pDD[i]! +
        w.consistency * pCons[i]! +
        w.maxDD * pMaxDD[i]!);
  });

  funds.sort((a, b) =>
    a.eligible === b.eligible ? b.score - a.score : a.eligible ? -1 : 1,
  );


  const top = funds.filter((f) => f.eligible).slice(0, TOP_N);

  const step = Math.max(1, Math.floor(indexWin.length / 90));
  const series = indexWin
    .filter((_, i) => i % step === 0 || i === indexWin.length - 1)
    .map((p) => {
      const row: SeriesPoint = {
        date: p.date,
        index: (p.nav / indexWin[0]!.nav) * 100,
      };
      const keys = SERIES_KEYS;
      top.forEach((f, i) => {
        const pt = f.win.find((q) => q.date >= p.date);
        if (pt) row[keys[i]!] = (pt.nav / f.win[0]!.nav) * 100;
      });
      return row;
    });

  return {
    category: input.category,
    indexKey: input.indexKey,
    indexLabel: idx.label,
    start: indexWin[0]!.date,
    end: indexWin[indexWin.length - 1]!.date,
    indexReturn: indexStats.ret,
    indexDrift: indexStats.ret,
    analysed: funds.length,
    ranked: ranked.length,
    aum: {
      min: knownAum.length ? Math.min(...knownAum) : null,
      max: knownAum.length ? Math.max(...knownAum) : null,
      avg: aumAvg,
      covered: knownAum.length,
      floor: aumFloor,
    },
    screen: { minAgeYears: MIN_AGE_YEARS, minAumShare: MIN_AUM_SHARE },
    window: {
      start: indexWin[0]!.date,
      end: indexWin[indexWin.length - 1]!.date,
      days: windowDays,
      drift: indexStats.ret,
      band: windowBand,
      qualifies:
        windowDays >= SIDEWAYS_RULE.minDays &&
        Math.abs(indexStats.ret) <= SIDEWAYS_RULE.maxDrift &&
        windowBand <= SIDEWAYS_RULE.maxBand,
    },
    funds: funds.map(({ win: _win, ...f }) => f),
    series,
  };
}


/** clean two-line series: one fund rebased against its benchmark over a window */
export async function fundVsIndex(input: {
  code: number;
  indexKey: IndexKey;
  start: string;
  end: string;
}) {
  const idx = INDEXES.find((i) => i.key === input.indexKey)!;
  const [fund, index] = await Promise.all([fetchScheme(input.code), fetchScheme(idx.code)]);
  const fw = slice(fund.points, input.start, input.end);
  const iw = slice(index.points, input.start, input.end);
  if (fw.length < 2 || iw.length < 2) throw new Error("Not enough history for that fund window.");
  const base = fw[0]!.nav;
  const ibase = iw[0]!.nav;
  const imap = new Map(iw.map((p) => [p.date, p.nav]));
  let lastIdx = ibase;
  const step = Math.max(1, Math.floor(fw.length / 140));
  const points = fw
    .filter((_, i) => i % step === 0 || i === fw.length - 1)
    .map((p) => {
      lastIdx = imap.get(p.date) ?? lastIdx;
      return {
        date: p.date,
        fund: (p.nav / base) * 100,
        index: (lastIdx / ibase) * 100,
      };
    });
  return {
    name: fund.meta.scheme_name,
    indexLabel: idx.label,
    points,
    fundReturn: (fw[fw.length - 1]!.nav / base - 1) * 100,
    indexReturn: (iw[iw.length - 1]!.nav / ibase - 1) * 100,
  };
}

/**
 * Result memoisation. Both the sideways scan and a full category analysis take
 * seconds (S3 parquet reads + upstream AUM lookups), and the combined / dip
 * views ask for the same windows repeatedly. Cache the finished result per key
 * and de-duplicate concurrent callers so repeat requests are instant.
 */
// Layered memoisation (memory + in-flight de-dupe + durable backend cache)
// lives in memo.server.ts so a warm result is shared across users and restarts.

export const detectSideways = memoise(detectSidewaysUncached, (k: IndexKey) => k);

export const analyse = memoise(
  analyseUncached,
  (i: { category: CategoryKey; indexKey: IndexKey; start: string; end: string }) =>
    `${i.category}|${i.indexKey}|${i.start}|${i.end}`,
);
