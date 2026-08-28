/**
 * Harvests published fund-house documents (monthly factsheets, portfolio
 * disclosures, scheme information documents) and archives them in S3.
 *
 * Discovery order per AMC page:
 *   1. plain HTML fetch  -> collect <a href="...pdf">
 *   2. Firecrawl /map    -> site-wide PDF links (JS-heavy AMC sites)
 *
 * Everything found is downloaded through the existing document store, so each
 * file lands under documents/<house>/<doc-type>/ and is added to the catalogue.
 */

import { FUND_HOUSES, type FundHouseDef } from "./fund-houses";
import { S3_PATHS, type DocType } from "./s3-layout";

const UA = "Mozilla/5.0 (compatible; MFLens/1.0; +https://fundlens.sandipprodhan.in)";

export type HarvestReport = {
  job: "harvest-docs";
  at: string;
  houses: number;
  discovered: number;
  stored: number;
  skipped: number;
  errors: string[];
  files: { fundHouse: string; docType: DocType; fileName: string }[];
};

type Candidate = { url: string; text: string };

function classify(candidate: Candidate): DocType | null {
  const s = `${candidate.url} ${candidate.text}`.toLowerCase();
  if (/(factsheet|fact-sheet|fund\s*fact|monthly[-_\s]*(fund|fact)|mfs)/.test(s)) return "factsheet";
  if (/(portfolio|holding|disclosure[-_\s]*of[-_\s]*portfolio|monthly[-_\s]*portfolio)/.test(s))
    return "portfolio-disclosure";
  if (/(sid|scheme[-_\s]*information[-_\s]*document|kim)/.test(s)) return "sid-scheme-document";
  if (/annual[-_\s]*report/.test(s)) return "annual-report";
  return null;
}

function absolute(href: string, base: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

async function htmlPdfLinks(pageUrl: string): Promise<Candidate[]> {
  const res = await fetch(pageUrl, {
    headers: { "user-agent": UA, accept: "text/html,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`page ${pageUrl} [${res.status}]`);
  const html = await res.text();
  const out: Candidate[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,180}?)<\/a>/gi)) {
    const href = m[1]!;
    if (!/\.pdf(\?|#|$)/i.test(href)) continue;
    const url = absolute(href, pageUrl);
    if (!url) continue;
    out.push({ url, text: m[2]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
  }
  return out;
}

async function firecrawlPdfLinks(pageUrl: string, search: string): Promise<Candidate[]> {
  const { gatewayHeaders, call } = await import("./firecrawl.server");
  const headers = gatewayHeaders();
  if (!headers) return [];
  const origin = new URL(pageUrl).origin;
  const payload = await call("/map", { url: origin, search, limit: 60 }, headers);
  const links = (payload["links"] ?? (payload["data"] as Record<string, unknown>)?.["links"] ?? []) as unknown[];
  return links
    .map((l) => (typeof l === "string" ? { url: l, title: "" } : (l as { url?: string; title?: string })))
    .filter((l): l is { url: string; title?: string } => !!l.url && /\.pdf(\?|#|$)/i.test(l.url))
    .map((l) => ({ url: l.url, text: l.title ?? "" }));
}

function fileNameOf(url: string) {
  const raw = decodeURIComponent(new URL(url).pathname.split("/").pop() || "document.pdf");
  return raw.toLowerCase().endsWith(".pdf") ? raw : `${raw}.pdf`;
}

/** Harvest documents for one fund house. */
export async function harvestHouse(house: FundHouseDef, perHouseLimit: number) {
  const { ingestDocumentFromUrl, readDocumentIndex } = await import("./docs-store.server");
  const existing = new Set((await readDocumentIndex()).map((d) => d.key));

  const candidates = new Map<string, Candidate>();
  const errors: string[] = [];

  for (const page of house.pages) {
    try {
      for (const c of await htmlPdfLinks(page)) candidates.set(c.url, c);
    } catch (err) {
      errors.push(`${house.name}: ${err instanceof Error ? err.message : "page failed"}`);
    }
  }

  if (candidates.size === 0 && house.pages[0]) {
    for (const term of ["factsheet", "monthly portfolio"]) {
      try {
        for (const c of await firecrawlPdfLinks(house.pages[0], term)) candidates.set(c.url, c);
      } catch (err) {
        errors.push(`${house.name} (map): ${err instanceof Error ? err.message : "map failed"}`);
      }
    }
  }

  const typed = [...candidates.values()]
    .map((c) => ({ ...c, docType: classify(c) }))
    .filter((c): c is Candidate & { docType: DocType } => c.docType !== null)
    .sort((a, b) => (a.docType === "factsheet" ? -1 : 0) - (b.docType === "factsheet" ? -1 : 0))
    .slice(0, perHouseLimit);

  const files: HarvestReport["files"] = [];
  let skipped = 0;

  for (const c of typed) {
    const fileName = fileNameOf(c.url);
    const key = S3_PATHS.documents(house.name, c.docType, fileName);
    if (existing.has(key)) {
      skipped++;
      continue;
    }
    try {
      const entry = await ingestDocumentFromUrl({
        fundHouse: house.name,
        docType: c.docType,
        sourceUrl: c.url,
        fileName,
      });
      files.push({ fundHouse: house.name, docType: entry.docType, fileName: entry.fileName });
    } catch (err) {
      errors.push(`${house.name} ${fileName}: ${err instanceof Error ? err.message : "download failed"}`);
    }
  }

  return { discovered: typed.length, files, skipped, errors };
}

/** Harvest documents for every registered AMC (or a single one). */
export async function harvestFundDocuments(input?: {
  house?: string | undefined;
  perHouseLimit?: number | undefined;
}): Promise<HarvestReport> {
  const perHouseLimit = input?.perHouseLimit ?? 4;
  const houses = input?.house
    ? FUND_HOUSES.filter((h) => h.name.toLowerCase() === input.house!.toLowerCase())
    : FUND_HOUSES;

  const report: HarvestReport = {
    job: "harvest-docs",
    at: new Date().toISOString(),
    houses: houses.length,
    discovered: 0,
    stored: 0,
    skipped: 0,
    errors: [],
    files: [],
  };

  for (const house of houses) {
    try {
      const res = await harvestHouse(house, perHouseLimit);
      report.discovered += res.discovered;
      report.stored += res.files.length;
      report.skipped += res.skipped;
      report.files.push(...res.files);
      report.errors.push(...res.errors);
    } catch (err) {
      report.errors.push(`${house.name}: ${err instanceof Error ? err.message : "harvest failed"}`);
    }
  }

  const { s3PutJSON } = await import("./s3.server");
  await s3PutJSON(S3_PATHS.ingestLog("harvest-docs", report.at), report).catch(() => null);
  return report;
}
