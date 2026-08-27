/**
 * Parquet-backed NAV history stored in S3.
 *
 * One Parquet file per scheme (`date`, `nav`, `scheme_code`), partitioned by
 * category and scheme code. Reads are cached in memory; writes rewrite the
 * whole scheme file after merging new rows (NAV history is small — a 20-year
 * daily series is ~5k rows).
 */

import { parquetReadObjects } from "hyparquet";
import { parquetWriteBuffer } from "hyparquet-writer";
import type { NavPoint } from "./mf-catalog";
import { CATEGORIES } from "./mf-catalog";
import { S3_PATHS, type LakeCategory, type SchemeManifestEntry } from "./s3-layout";
import { isS3Configured, s3GetBytes, s3GetJSON, s3List, s3PutBytes, s3PutJSON } from "./s3.server";

const TTL = 1000 * 60 * 60 * 6;
const cache = new Map<number, { at: number; value: NavPoint[] }>();
const inflight = new Map<number, Promise<NavPoint[]>>();
let keyIndex: { at: number; value: Map<number, string> } | null = null;

export function isNavLakeConfigured() {
  return isS3Configured();
}

/** Map of scheme code -> parquet key, built from a single bucket listing. */
async function schemeKeyIndex(): Promise<Map<number, string>> {
  if (keyIndex && Date.now() - keyIndex.at < TTL) return keyIndex.value;
  const map = new Map<number, string>();
  try {
    for (const obj of await s3List(S3_PATHS.navParquetPrefix())) {
      const code = Number(obj.key.match(/scheme_code=(\d+)/)?.[1]);
      if (Number.isFinite(code) && obj.key.endsWith(".parquet")) map.set(code, obj.key);
    }
  } catch {
    /* listing failures fall back to the daily feed */
  }
  keyIndex = { at: Date.now(), value: map };
  return map;
}

function invalidate(code: number) {
  cache.delete(code);
  keyIndex = null;
}

function decodeRows(rows: Record<string, unknown>[]): NavPoint[] {
  const points: NavPoint[] = [];
  for (const row of rows) {
    const date = String(row["date"] ?? "").slice(0, 10);
    const nav = Number(row["nav"]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(nav) && nav > 0) points.push({ date, nav });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

/** Full NAV history for a scheme, or an empty array when the lake has none. */
export async function readNavParquet(code: number): Promise<NavPoint[]> {
  if (!isS3Configured()) return [];
  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const running = inflight.get(code);
  if (running) return running;

  const task = (async () => {
    try {
      const key = (await schemeKeyIndex()).get(code);
      if (!key) return [];
      const bytes = await s3GetBytes(key);
      if (!bytes) return [];
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const rows = (await parquetReadObjects({ file: buffer })) as Record<string, unknown>[];
      const points = decodeRows(rows);
      cache.set(code, { at: Date.now(), value: points });
      return points;
    } catch {
      return hit?.value ?? [];
    }
  })().finally(() => inflight.delete(code));

  inflight.set(code, task);
  return task;
}

/** Merge new points into a scheme's Parquet file and refresh the category manifest. */
export async function writeNavParquet(input: {
  category: LakeCategory;
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  schemeCategory?: string;
  points: NavPoint[];
}): Promise<SchemeManifestEntry> {
  const existing = await readNavParquet(input.schemeCode);
  const merged = [...new Map([...existing, ...input.points].map((p) => [p.date, p])).values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (!merged.length) throw new Error(`No NAV rows to store for scheme ${input.schemeCode}`);

  const buffer = parquetWriteBuffer({
    columnData: [
      { name: "date", data: merged.map((p) => p.date), type: "STRING" },
      { name: "nav", data: merged.map((p) => p.nav), type: "DOUBLE" },
      { name: "scheme_code", data: merged.map(() => input.schemeCode), type: "INT32" },
    ],
    
  });

  const key = S3_PATHS.navParquet(input.category, input.schemeCode);
  await s3PutBytes(key, new Uint8Array(buffer), "application/vnd.apache.parquet");
  invalidate(input.schemeCode);
  cache.set(input.schemeCode, { at: Date.now(), value: merged });

  const entry: SchemeManifestEntry = {
    schemeCode: input.schemeCode,
    schemeName: input.schemeName,
    fundHouse: input.fundHouse,
    schemeCategory: input.schemeCategory ?? "",
    firstDate: merged[0]!.date,
    lastDate: merged[merged.length - 1]!.date,
    rows: merged.length,
    updatedAt: new Date().toISOString(),
  };
  await upsertManifest(input.category, entry);
  return entry;
}

export async function readManifest(category: LakeCategory): Promise<SchemeManifestEntry[]> {
  return (await s3GetJSON<SchemeManifestEntry[]>(S3_PATHS.navManifest(category))) ?? [];
}

async function upsertManifest(category: LakeCategory, entry: SchemeManifestEntry) {
  const current = await readManifest(category);
  const next = [...current.filter((e) => e.schemeCode !== entry.schemeCode), entry].sort(
    (a, b) => b.rows - a.rows,
  );
  await s3PutJSON(S3_PATHS.navManifest(category), next);
  metaIndex = null;
}

export const LAKE_CATEGORIES: LakeCategory[] = [...CATEGORIES.map((c) => c.key), "index"];

let metaIndex: { at: number; value: Map<number, SchemeManifestEntry & { category: LakeCategory }> } | null = null;

/** Scheme metadata (name, fund house, coverage) for everything stored in the lake. */
export async function schemeMetaIndex() {
  if (metaIndex && Date.now() - metaIndex.at < TTL) return metaIndex.value;
  const map = new Map<number, SchemeManifestEntry & { category: LakeCategory }>();
  if (isS3Configured()) {
    await Promise.all(
      LAKE_CATEGORIES.map(async (category) => {
        for (const entry of await readManifest(category).catch(() => [])) {
          map.set(entry.schemeCode, { ...entry, category });
        }
      }),
    );
  }
  metaIndex = { at: Date.now(), value: map };
  return map;
}

/** Scheme codes the lake already tracks for a category, best-covered first. */
export async function lakeCategoryCodes(category: LakeCategory): Promise<number[]> {
  const manifest = await readManifest(category).catch(() => []);
  return manifest.filter((m) => m.rows > 100).map((m) => m.schemeCode);
}

/** Health snapshot used by the storage admin view. */
export async function navLakeStatus() {
  if (!isS3Configured()) {
    return { configured: false, schemes: 0, bytes: 0, latest: null as string | null, error: null as string | null };
  }
  try {
    const objects = await s3List(S3_PATHS.navParquetPrefix());
    const parquet = objects.filter((o) => o.key.endsWith(".parquet"));
    return {
      configured: true,
      schemes: parquet.length,
      bytes: parquet.reduce((sum, o) => sum + o.size, 0),
      latest: parquet.map((o) => o.lastModified).sort().at(-1) ?? null,
      error: null as string | null,
    };
  } catch (err) {
    return {
      configured: true,
      schemes: 0,
      bytes: 0,
      latest: null,
      error: err instanceof Error ? err.message : "Unknown S3 error",
    };
  }
}
