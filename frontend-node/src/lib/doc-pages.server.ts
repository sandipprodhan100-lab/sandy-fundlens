/**
 * Locates a scheme inside an archived fund-house PDF.
 *
 * Monthly factsheets bundle every scheme of an AMC into one large PDF, so a raw
 * download is not very useful on its own. We read the stored PDF page by page,
 * cache a light per-page fingerprint in S3 (documents/_pages/<doc>.json) and use
 * it to tell the reader which page their fund starts on.
 */

import { S3_PATHS, slug, type DocumentEntry } from "./s3-layout";
import { memoise } from "./memo.server";

export type FundDocument = {
  key: string;
  fileName: string;
  docType: string;
  fundHouse: string;
  uploadedAt: string;
  sizeBytes: number;
  sourceUrl?: string | undefined;
  /** 1-based page where the scheme's section starts, null when not located */
  startPage: number | null;
  pages: number | null;
  matchQuality: "exact" | "likely" | "not-found";
  downloadUrl: string;
};

type PageFingerprint = { pages: string[]; builtAt: string };

const pagesKey = (docKey: string) => `documents/_pages/${slug(docKey)}.json`;

const NOISE = new Set([
  "fund",
  "scheme",
  "plan",
  "direct",
  "regular",
  "growth",
  "idcw",
  "dividend",
  "payout",
  "reinvestment",
  "option",
  "mutual",
  "the",
  "an",
  "open",
  "ended",
]);

function tokens(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NOISE.has(t));
}

/** Per-page text fingerprint for a stored PDF, cached in S3. */
async function pageFingerprint(docKey: string): Promise<PageFingerprint | null> {
  const { s3GetJSON, s3PutJSON, s3GetBytes } = await import("./s3.server");
  const cached = await s3GetJSON<PageFingerprint>(pagesKey(docKey)).catch(() => null);
  if (cached?.pages?.length) return cached;

  const bytes = await s3GetBytes(docKey).catch(() => null);
  if (!bytes) return null;

  const { extractText, getDocumentProxy } = await import("unpdf");
  const doc = await getDocumentProxy(bytes);
  const { text } = await extractText(doc, { mergePages: false });
  const raw = Array.isArray(text) ? text : [String(text)];
  // keep only the heading area of each page — enough to spot the scheme title
  const pages = raw.map((t) =>
    String(t ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 700)
      .toLowerCase(),
  );

  const fingerprint: PageFingerprint = { pages, builtAt: new Date().toISOString() };
  await s3PutJSON(pagesKey(docKey), fingerprint).catch(() => null);
  return fingerprint;
}

function locate(fingerprint: PageFingerprint, fundName: string) {
  const want = tokens(fundName);
  if (want.length === 0) return { startPage: null, quality: "not-found" as const };

  let best: { page: number; score: number } | null = null;
  fingerprint.pages.forEach((pageText, i) => {
    if (!pageText) return;
    // headings sit at the top of the page — weight the first 200 chars higher
    const head = pageText.slice(0, 200);
    let score = 0;
    for (const t of want) {
      if (head.includes(t)) score += 2;
      else if (pageText.includes(t)) score += 1;
    }
    let normalised = score / (want.length * 2);
    // contents / index pages mention every scheme — they are not the fund's page
    const mentions = (pageText.match(/fund/g) ?? []).length;
    if (mentions > 8) normalised *= 0.45;
    if (!best || normalised > best.score) best = { page: i + 1, score: normalised };
  });

  const found = best as { page: number; score: number } | null;
  if (!found || found.score < 0.5) return { startPage: null, quality: "not-found" as const };
  return { startPage: found.page, quality: found.score >= 0.8 ? ("exact" as const) : ("likely" as const) };
}

async function buildFundDocuments(fundName: string): Promise<FundDocument[]> {
  const { readDocumentIndex, documentDownloadUrl } = await import("./docs-store.server");
  const { matchFundHouse } = await import("./fund-houses");

  const house = matchFundHouse(fundName);
  if (!house) return [];

  const index = await readDocumentIndex().catch(() => [] as DocumentEntry[]);
  const mine = index
    .filter((d) => slug(d.fundHouse) === slug(house.name))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 6);

  const out = await Promise.all(
    mine.map(async (d): Promise<FundDocument> => {
      const fingerprint =
        d.fileName.toLowerCase().endsWith(".pdf") ? await pageFingerprint(d.key).catch(() => null) : null;
      const located = fingerprint ? locate(fingerprint, fundName) : { startPage: null, quality: "not-found" as const };
      return {
        key: d.key,
        fileName: d.fileName,
        docType: d.docType,
        fundHouse: d.fundHouse,
        uploadedAt: d.uploadedAt,
        sizeBytes: d.size,
        sourceUrl: d.sourceUrl,
        startPage: located.startPage,
        pages: fingerprint?.pages.length ?? null,
        matchQuality: located.quality,
        downloadUrl: await documentDownloadUrl(d.key),
      };
    }),
  );

  return out.sort((a, b) => Number(b.startPage !== null) - Number(a.startPage !== null));
}

/** Fund-house PDFs for a scheme, with the page its section starts on. */
// signed URLs expire, so keep the cache short
export const fundDocuments = memoise<string, FundDocument[]>(
  buildFundDocuments,
  (fundName) => `fund-docs:${slug(fundName)}`,
  1000 * 60 * 10,
);
