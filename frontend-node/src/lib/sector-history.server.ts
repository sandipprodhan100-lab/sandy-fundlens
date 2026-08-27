/**
 * Sector allocation drift for a ranked fund: 6 months ago -> 3 months ago -> now.
 *
 * Sector weights are derived from the fund's published portfolio (the same
 * holdings source the app already uses) and snapshotted into S3 once a month,
 * so the lake accumulates its own history instead of guessing one. Months with
 * no stored filing are reported as "no filing" rather than interpolated.
 */

import { s3GetJSON, s3PutJSON, isS3Configured } from "./s3.server";
import { fetchHoldings } from "./holdings.server";
import { memoise } from "./memo.server";

export type SectorSnapshot = {
  month: string; // YYYY-MM
  asOf: string | null;
  source: string | null;
  weights: { sector: string; weight: number }[];
};

export type SectorDriftRow = {
  sector: string;
  m6: number | null;
  m3: number | null;
  now: number | null;
  change: number | null;
};

export type SectorDrift = {
  code: number;
  name: string;
  months: { now: string; m3: string; m6: string };
  available: { now: boolean; m3: boolean; m6: boolean };
  rows: SectorDriftRow[];
  summary: string;
  source: string | null;
  note: string | null;
};

const snapshotKey = (code: number, month: string) => `documents/_sectors/${code}/${month}.json`;

function monthOf(d: Date) {
  return d.toISOString().slice(0, 7);
}

function monthsAgo(n: number) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  return monthOf(d);
}

function aggregate(holdings: { sector: string | null; weight: number | null }[]) {
  const map = new Map<string, number>();
  for (const h of holdings) {
    const sector = (h.sector ?? "").trim();
    if (!sector || h.weight == null || !Number.isFinite(h.weight)) continue;
    map.set(sector, (map.get(sector) ?? 0) + h.weight);
  }
  return [...map.entries()]
    .map(([sector, weight]) => ({ sector, weight: Math.round(weight * 100) / 100 }))
    .sort((a, b) => b.weight - a.weight);
}

async function readSnapshot(code: number, month: string): Promise<SectorSnapshot | null> {
  if (!isS3Configured()) return null;
  try {
    return await s3GetJSON<SectorSnapshot>(snapshotKey(code, month));
  } catch {
    return null;
  }
}

async function getSectorDriftUncached(input: {
  schemeCode: number;
  fundName: string;
}): Promise<SectorDrift> {
  const nowMonth = monthsAgo(0);
  const m3 = monthsAgo(3);
  const m6 = monthsAgo(6);

  const [stored, snap3, snap6] = await Promise.all([
    readSnapshot(input.schemeCode, nowMonth),
    readSnapshot(input.schemeCode, m3),
    readSnapshot(input.schemeCode, m6),
  ]);

  let current = stored;
  if (!current) {
    const holdings = await fetchHoldings({
      schemeCode: input.schemeCode,
      fundName: input.fundName,
    });
    const weights = aggregate(holdings.holdings);
    if (weights.length) {
      current = { month: nowMonth, asOf: holdings.asOf, source: holdings.source, weights };
      if (isS3Configured()) {
        // best effort: keep building our own month-by-month sector history
        void s3PutJSON(snapshotKey(input.schemeCode, nowMonth), current).catch(() => {});
      }
    }
  }

  const pick = (snap: SectorSnapshot | null, sector: string) =>
    snap?.weights.find((w) => w.sector.toLowerCase() === sector.toLowerCase())?.weight ?? null;

  const sectors = new Set<string>();
  for (const s of [current, snap3, snap6]) for (const w of s?.weights ?? []) sectors.add(w.sector);

  const rows: SectorDriftRow[] = [...sectors]
    .map((sector) => {
      const now = pick(current, sector);
      const a3 = pick(snap3, sector);
      const a6 = pick(snap6, sector);
      const base = a6 ?? a3;
      return {
        sector,
        m6: a6,
        m3: a3,
        now,
        change: now != null && base != null ? Math.round((now - base) * 100) / 100 : null,
      };
    })
    .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0) || (b.now ?? 0) - (a.now ?? 0));

  const moves = rows.filter((r) => r.change != null && Math.abs(r.change) >= 0.5);
  const up = moves.filter((r) => (r.change ?? 0) > 0)[0];
  const down = [...moves].reverse().filter((r) => (r.change ?? 0) < 0)[0];
  const summary = up || down
    ? [
        up ? `added ${up.change!.toFixed(1)}pp ${up.sector}` : null,
        down ? `cut ${Math.abs(down.change!).toFixed(1)}pp ${down.sector}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "No stored earlier filing yet — this month's allocation becomes the baseline.";

  return {
    code: input.schemeCode,
    name: input.fundName,
    months: { now: nowMonth, m3, m6 },
    available: { now: !!current, m3: !!snap3, m6: !!snap6 },
    rows: rows.slice(0, 14),
    summary,
    source: current?.source ?? null,
    note: current ? null : "No sector-wise portfolio could be read for this fund right now.",
  };
}

/** Sector drift is stable within a day; memoise per scheme so panels warm instantly. */
export const getSectorDrift = memoise(
  getSectorDriftUncached,
  (i: { schemeCode: number; fundName: string }) => String(i.schemeCode),
  1000 * 60 * 60 * 6,
);
