/**
 * Daily NAV ingest from the official AMFI India portal into S3.
 *
 * Flow: download NAVAll.txt -> archive the raw file under nav/raw/amfi/dt=<date>/
 * -> merge each tracked scheme's new NAV row into its Parquet file.
 */

import type { CategoryKey, NavPoint } from "./mf-catalog";
import { CATEGORIES, INDEXES } from "./mf-catalog";
import { S3_PATHS } from "./s3-layout";
import { s3PutBytes, s3PutJSON } from "./s3.server";
import { LAKE_CATEGORIES, readManifest, writeNavParquet } from "./nav-parquet.server";

const AMFI_SOURCES = [
  "https://portal.amfiindia.com/spages/NAVAll.txt",
  "https://www.amfiindia.com/spages/NAVAll.txt",
];

export type AmfiRow = {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  nav: number;
  date: string;
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function toISO(amfiDate: string): string | null {
  const m = amfiDate.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]!.toLowerCase()) + 1;
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}

export async function downloadNavAll(): Promise<string> {
  let lastErr: unknown;
  for (const url of AMFI_SOURCES) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { accept: "text/plain", "user-agent": "MFLens/1.0 (+https://mutualfundlens.lovable.app)" },
          signal: AbortSignal.timeout(60000),
        });
        if (!res.ok) throw new Error(`AMFI responded ${res.status}`);
        const text = await res.text();
        if (text.length < 10000) throw new Error("AMFI payload looks truncated");
        return text;
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Could not download NAVAll.txt from AMFI");
}

/** Parse the semicolon-delimited NAVAll.txt payload. Fund-house headings are plain lines. */
export function parseNavAll(text: string): AmfiRow[] {
  const rows: AmfiRow[] = [];
  let fundHouse = "";
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.includes(";")) {
      if (/mutual fund/i.test(trimmed)) fundHouse = trimmed;
      continue;
    }
    const cells = trimmed.split(";");
    if (cells.length < 6 || cells[0] === "Scheme Code") continue;
    const schemeCode = Number(cells[0]);
    const nav = Number(cells[4]);
    const date = toISO(cells[5] ?? "");
    if (!Number.isFinite(schemeCode) || !Number.isFinite(nav) || nav <= 0 || !date) continue;
    rows.push({ schemeCode, schemeName: cells[3]!.trim(), fundHouse, nav, date });
  }
  return rows;
}

export type IngestReport = {
  job: string;
  startedAt: string;
  finishedAt: string;
  rawKey?: string;
  totalRows: number;
  trackedSchemes: number;
  updatedSchemes: number;
  skipped: number;
  errors: string[];
};

/**
 * Daily job: archive the official file and append new NAV rows to every tracked
 * scheme's Parquet partition.
 */
export async function ingestDailyNav(): Promise<IngestReport> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  const text = await downloadNavAll();
  const rows = parseNavAll(text);
  const asOf = rows[0]?.date ?? startedAt.slice(0, 10);

  const rawKey = S3_PATHS.navRawDaily(asOf);
  await s3PutBytes(rawKey, text, "text/plain");

  const byCode = new Map<number, AmfiRow>();
  for (const row of rows) byCode.set(row.schemeCode, row);

  let tracked = 0;
  let updated = 0;
  let skipped = 0;

  for (const cat of LAKE_CATEGORIES) {
    const manifest = await readManifest(cat);
    tracked += manifest.length;
    for (const entry of manifest) {
      const row = byCode.get(entry.schemeCode);
      if (!row) {
        skipped++;
        continue;
      }
      if (row.date <= entry.lastDate) {
        skipped++;
        continue;
      }
      try {
        await writeNavParquet({
          category: cat,
          schemeCode: entry.schemeCode,
          schemeName: entry.schemeName || row.schemeName,
          fundHouse: entry.fundHouse || row.fundHouse,
          points: [{ date: row.date, nav: row.nav } satisfies NavPoint],
        });
        updated++;
      } catch (err) {
        errors.push(`${entry.schemeCode}: ${err instanceof Error ? err.message : "write failed"}`);
      }
    }
  }

  const report: IngestReport = {
    job: "daily-nav",
    startedAt,
    finishedAt: new Date().toISOString(),
    rawKey,
    totalRows: rows.length,
    trackedSchemes: tracked,
    updatedSchemes: updated,
    skipped,
    errors,
  };
  await s3PutJSON(S3_PATHS.ingestLog("daily-nav", report.finishedAt), report).catch(() => undefined);
  return report;
}

/**
 * Backfill job: seed Parquet history for one category from the full AMFI daily
 * NAV archive exposed by the public NAV history service.
 */
export async function backfillCategory(category: CategoryKey, limit = 40): Promise<IngestReport> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const { categoryCandidates, fetchScheme } = await import("./mf.server");
  const codes = (await categoryCandidates(category, limit, "directory")).slice(0, limit);

  let updated = 0;
  let rowCount = 0;
  for (const code of codes) {
    try {
      const scheme = await fetchScheme(code);
      if (scheme.points.length < 100) continue;
      await writeNavParquet({
        category,
        schemeCode: code,
        schemeName: scheme.meta.scheme_name,
        fundHouse: scheme.meta.fund_house,
        schemeCategory: scheme.meta.scheme_category,
        points: scheme.points,
      });
      rowCount += scheme.points.length;
      updated++;
    } catch (err) {
      errors.push(`${code}: ${err instanceof Error ? err.message : "backfill failed"}`);
    }
  }

  const report: IngestReport = {
    job: `backfill-${category}`,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalRows: rowCount,
    trackedSchemes: codes.length,
    updatedSchemes: updated,
    skipped: codes.length - updated,
    errors,
  };
  await s3PutJSON(S3_PATHS.ingestLog(report.job, report.finishedAt), report).catch(() => undefined);
  return report;
}

/** Seed the benchmark index proxies used for sideways detection. */
export async function backfillIndexes(): Promise<IngestReport> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const { fetchScheme } = await import("./mf.server");
  const codes = [...new Set(INDEXES.flatMap((i) => [i.code, ...(i.fallbacks ?? [])]))];

  let updated = 0;
  let rowCount = 0;
  for (const code of codes) {
    try {
      const scheme = await fetchScheme(code);
      if (scheme.points.length < 100) continue;
      await writeNavParquet({
        category: "index",
        schemeCode: code,
        schemeName: scheme.meta.scheme_name,
        fundHouse: scheme.meta.fund_house,
        schemeCategory: scheme.meta.scheme_category,
        points: scheme.points,
      });
      rowCount += scheme.points.length;
      updated++;
    } catch (err) {
      errors.push(`${code}: ${err instanceof Error ? err.message : "backfill failed"}`);
    }
  }

  const report: IngestReport = {
    job: "backfill-index",
    startedAt,
    finishedAt: new Date().toISOString(),
    totalRows: rowCount,
    trackedSchemes: codes.length,
    updatedSchemes: updated,
    skipped: codes.length - updated,
    errors,
  };
  await s3PutJSON(S3_PATHS.ingestLog(report.job, report.finishedAt), report).catch(() => undefined);
  return report;
}

/**
 * One-shot migration: seed every category plus the benchmark indexes into the
 * lake, then top up with today's official NAV file.
 */
export async function migrateAll(limit = 60): Promise<IngestReport> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let tracked = 0;
  let updated = 0;
  let rows = 0;

  for (const cat of CATEGORIES) {
    const r = await backfillCategory(cat.key, limit).catch((err): IngestReport | null => {
      errors.push(`${cat.key}: ${err instanceof Error ? err.message : "backfill failed"}`);
      return null;
    });
    if (!r) continue;
    tracked += r.trackedSchemes;
    updated += r.updatedSchemes;
    rows += r.totalRows;
    errors.push(...r.errors);
  }

  const idx = await backfillIndexes().catch((): IngestReport | null => null);
  if (idx) {
    tracked += idx.trackedSchemes;
    updated += idx.updatedSchemes;
    rows += idx.totalRows;
    errors.push(...idx.errors);
  }

  const report: IngestReport = {
    job: "migrate-all",
    startedAt,
    finishedAt: new Date().toISOString(),
    totalRows: rows,
    trackedSchemes: tracked,
    updatedSchemes: updated,
    skipped: Math.max(0, tracked - updated),
    errors: errors.slice(0, 50),
  };
  await s3PutJSON(S3_PATHS.ingestLog(report.job, report.finishedAt), report).catch(() => undefined);
  return report;
}
