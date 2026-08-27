/**
 * Fund size (AUM) + quarterly net flow.
 *
 * AUM comes from Kuvera's public scheme API, which publishes a current fund size for
 * every Indian scheme. Kuvera reports the figure in units of ₹0.1 lakh, so the value is
 * divided by 10 to get ₹ crore (validated against published AMC fact sheets).
 *
 * Kuvera has no AUM history, so quarterly flows are computed from our own snapshots:
 * every analysis run stores (scheme, date, AUM, NAV). Once two quarterly snapshots exist,
 * the net investor flow for a quarter is
 *     flow = AUM_end − AUM_start × (NAV_end / NAV_start)
 * i.e. the change in fund size that market movement alone cannot explain.
 */

const LIST_URL = "https://api.kuvera.in/mf/api/v4/fund_schemes/list.json";
const DETAIL = (code: string) => `https://api.kuvera.in/mf/api/v5/fund_schemes/${code}.json`;
const TTL = 1000 * 60 * 60 * 12;

export type AumInfo = { aumCrore: number | null; kuveraCode: string | null };
export type FlowInfo = {
  flowQ1: number | null;
  flowQ2: number | null;
  flowNote: string | null;
};

const DROP = new Set([
  "fund",
  "plan",
  "direct",
  "growth",
  "option",
  "scheme",
  "the",
  "reinvestment",
  "payout",
  "regular",
  "mutual",
  "g",
]);

function normalise(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ");
  return cleaned.split(" ").filter((t) => t && !DROP.has(t));
}

function keyOf(name: string) {
  return [...normalise(name)].sort().join(" ");
}

let listCache: { at: number; exact: Map<string, string>; tokens: { set: Set<string>; code: string }[] } | null =
  null;

async function getJSON(url: string, attempts = 3): Promise<unknown> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`Kuvera ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Fund size lookup failed");
}

async function getIndex() {
  if (listCache && Date.now() - listCache.at < TTL) return listCache;
  const raw = await getJSON(LIST_URL);
  const rows: { c: string; n: string }[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const v of node) {
        if (v && typeof v === "object" && "c" in (v as Record<string, unknown>)) rows.push(v as { c: string; n: string });
        else walk(v);
      }
    } else if (node && typeof node === "object") {
      for (const v of Object.values(node as Record<string, unknown>)) walk(v);
    }
  };
  walk(raw);

  const exact = new Map<string, string>();
  const tokens: { set: Set<string>; code: string }[] = [];
  for (const r of rows) {
    if (!r.c?.endsWith("-GR") || !/direct/i.test(r.n)) continue;
    const key = keyOf(r.n);
    if (!exact.has(key)) exact.set(key, r.c);
    tokens.push({ set: new Set(normalise(r.n)), code: r.c });
  }
  listCache = { at: Date.now(), exact, tokens };
  return listCache;
}

function matchCode(index: NonNullable<typeof listCache>, name: string) {
  const hit = index.exact.get(keyOf(name));
  if (hit) return hit;
  const want = new Set(normalise(name));
  let best: { score: number; code: string } | null = null;
  for (const row of index.tokens) {
    let shared = 0;
    for (const t of want) if (row.set.has(t)) shared++;
    const score = shared / (want.size + row.set.size - shared);
    if (!best || score > best.score) best = { score, code: row.code };
  }
  return best && best.score >= 0.8 ? best.code : null;
}

const detailCache = new Map<string, { at: number; aumCrore: number | null }>();

async function fetchAum(kuveraCode: string): Promise<number | null> {
  const hit = detailCache.get(kuveraCode);
  if (hit && Date.now() - hit.at < TTL) return hit.aumCrore;
  try {
    const raw = (await getJSON(DETAIL(kuveraCode))) as unknown;
    const row = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | undefined;
    const value = Number(row?.["aum"]);
    const aumCrore = Number.isFinite(value) && value > 0 ? value / 10 : null;
    detailCache.set(kuveraCode, { at: Date.now(), aumCrore });
    return aumCrore;
  } catch {
    if (hit) return hit.aumCrore;
    return null;
  }
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
          /* skip */
        }
      }
    }),
  );
  return out;
}

/** current AUM in ₹ crore for each scheme, keyed by AMFI scheme code */
export async function fetchAumMap(funds: { code: number; name: string }[]) {
  const map = new Map<number, AumInfo>();
  let index: NonNullable<typeof listCache>;
  try {
    index = await getIndex();
  } catch {
    for (const f of funds) map.set(f.code, { aumCrore: null, kuveraCode: null });
    return map;
  }
  const pairs = funds.map((f) => ({ ...f, kuveraCode: matchCode(index, f.name) }));
  await pool(pairs, 12, async (p) => {
    const aumCrore = p.kuveraCode ? await fetchAum(p.kuveraCode) : null;
    map.set(p.code, { aumCrore, kuveraCode: p.kuveraCode });
  });
  for (const f of funds) if (!map.has(f.code)) map.set(f.code, { aumCrore: null, kuveraCode: null });

  // Fill any gap from the fund house's own factsheet stored in S3.
  const missing = funds.filter((f) => !map.get(f.code)?.aumCrore);
  if (missing.length > 0) {
    try {
      const { lookupSchemeFact } = await import("./doc-facts.server");
      await pool(missing, 6, async (f) => {
        const fact = await lookupSchemeFact(f.name);
        if (fact?.aumCrore) map.set(f.code, { aumCrore: fact.aumCrore, kuveraCode: map.get(f.code)?.kuveraCode ?? null });
      });
    } catch {
      /* factsheet facts unavailable */
    }
  }
  return map;
}

type Snapshot = { scheme_code: number; as_of: string; aum_crore: number; nav: number };

const DAY = 86400000;

function pick(rows: Snapshot[], asOf: number, targetDaysAgo: number, tolerance: number) {
  let best: { row: Snapshot; diff: number } | null = null;
  for (const row of rows) {
    const ago = (asOf - Date.parse(`${row.as_of}T00:00:00Z`)) / DAY;
    const diff = Math.abs(ago - targetDaysAgo);
    if (diff > tolerance) continue;
    if (!best || diff < best.diff) best = { row, diff };
  }
  return best?.row ?? null;
}

function flowBetween(prev: Snapshot | null, curr: { aum: number; nav: number } | Snapshot | null) {
  if (!prev || !curr) return null;
  const aum = "aum" in curr ? curr.aum : curr.aum_crore;
  const nav = curr.nav;
  if (!prev.nav || !prev.aum_crore || !nav) return null;
  return aum - prev.aum_crore * (nav / prev.nav);
}

/**
 * Store today's fund size + NAV and return the last two quarters' net flow
 * for every scheme we already have history for.
 */
export async function syncQuarterlyFlows(
  rows: { code: number; aumCrore: number | null; nav: number; asOf: string }[],
): Promise<Map<number, FlowInfo>> {
  const flows = new Map<number, FlowInfo>();
  const usable = rows.filter((r) => r.aumCrore !== null && r.nav > 0);
  const fallback = (note: string) => {
    for (const r of rows) flows.set(r.code, { flowQ1: null, flowQ2: null, flowNote: note });
    return flows;
  };
  if (usable.length === 0) return fallback("Fund size unavailable, so flows cannot be derived.");

  let supabaseAdmin;
  try {
    ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
  } catch {
    return fallback("Flow history store is unavailable.");
  }

  const codes = usable.map((r) => r.code);
  const since = new Date(Date.now() - 400 * DAY).toISOString().slice(0, 10);
  const { data: history, error } = await supabaseAdmin
    .from("fund_aum_snapshots")
    .select("scheme_code, as_of, aum_crore, nav")
    .in("scheme_code", codes)
    .gte("as_of", since)
    .order("as_of", { ascending: true });

  if (error) return fallback("Flow history is not available yet.");

  const today = new Date().toISOString().slice(0, 10);
  await supabaseAdmin.from("fund_aum_snapshots").upsert(
    usable.map((r) => ({
      scheme_code: r.code,
      as_of: today,
      aum_crore: r.aumCrore as number,
      nav: r.nav,
    })),
    { onConflict: "scheme_code,as_of" },
  );

  const byCode = new Map<number, Snapshot[]>();
  for (const row of (history ?? []) as Snapshot[]) {
    const list = byCode.get(row.scheme_code) ?? [];
    list.push(row);
    byCode.set(row.scheme_code, list);
  }

  const now = Date.parse(`${today}T00:00:00Z`);
  for (const r of rows) {
    if (r.aumCrore === null) {
      flows.set(r.code, { flowQ1: null, flowQ2: null, flowNote: "Fund size unavailable." });
      continue;
    }
    const hist = byCode.get(r.code) ?? [];
    const q1 = pick(hist, now, 91, 45);
    const q2 = pick(hist, now, 182, 45);
    const flowQ1 = flowBetween(q1, { aum: r.aumCrore, nav: r.nav });
    const flowQ2 = flowBetween(q2, q1);
    flows.set(r.code, {
      flowQ1,
      flowQ2,
      flowNote:
        flowQ1 === null
          ? "Quarterly flow needs one more quarter of tracked fund size — first snapshot recorded today."
          : flowQ2 === null
            ? "Only the latest quarter has enough tracked history so far."
            : null,
    });
  }
  return flows;
}
