/**
 * Canonical S3 layout for MF Lens. The bucket is the app's data plane.
 *
 *   nav/parquet/category=<cat>/scheme_code=<code>/nav.parquet   full NAV history (columnar)
 *   nav/raw/amfi/dt=<YYYY-MM-DD>/NAVAll.txt                     daily official AMFI download
 *   nav/_manifest/<category>.json                               scheme inventory per category
 *   documents/<fund_house_slug>/<doc_type>/<file>                fund-house documents
 *   documents/_index.json                                        document catalogue
 *   app/config/<name>.json                                       runtime configuration
 *   app/logs/ingest/<job>/<timestamp>.json                       ingest run logs
 */

import type { CategoryKey } from "./mf-catalog";

/** Partitions in the NAV lake: the fund categories plus benchmark index proxies. */
export type LakeCategory = CategoryKey | "index";

export const S3_PATHS = {
  navParquet: (category: LakeCategory, code: number) =>
    `nav/parquet/category=${category}/scheme_code=${code}/nav.parquet`,
  navParquetPrefix: (category?: LakeCategory) =>
    category ? `nav/parquet/category=${category}/` : "nav/parquet/",
  navRawDaily: (date: string) => `nav/raw/amfi/dt=${date}/NAVAll.txt`,
  navRawPrefix: "nav/raw/amfi/",
  navManifest: (category: LakeCategory) => `nav/_manifest/${category}.json`,
  documents: (house: string, docType: string, fileName: string) =>
    `documents/${slug(house)}/${slug(docType)}/${fileName.replace(/[^\w.\-]+/g, "_")}`,
  documentsPrefix: (house?: string) => (house ? `documents/${slug(house)}/` : "documents/"),
  documentIndex: "documents/_index.json",
  docFacts: (house: string) => `documents/_facts/${slug(house)}.json`,
  docFactsPrefix: "documents/_facts/",
  config: (name: string) => `app/config/${slug(name)}.json`,
  configPrefix: "app/config/",
  ingestLog: (job: string, iso: string) => `app/logs/ingest/${slug(job)}/${iso}.json`,
  ingestLogPrefix: (job?: string) => (job ? `app/logs/ingest/${slug(job)}/` : "app/logs/ingest/"),
  /** Pre-computed sideways-window snapshot */
  sidewaysSnapshot: (indexKey: string) => `analysis/_snapshots/sideways/${indexKey}.json`,
  /** Pre-computed full analysis snapshot */
  analysisSnapshot: (category: string, indexKey: string) =>
    `analysis/_snapshots/results/${category}_${indexKey}.json`,
  /** Pre-computed window-specific analysis snapshot */
  analysisSnapshotWindow: (category: string, indexKey: string, start: string, end: string) =>
    `analysis/_snapshots/results/${category}_${indexKey}_${start}_${end}.json`,
  /** Pre-computed combined multi-window analysis snapshot */
  combinedSnapshot: (category: string, indexKey: string) =>
    `analysis/_snapshots/combined/${category}_${indexKey}.json`,
  /** Snapshot metadata (last refresh timestamp, version) */
  snapshotMeta: "analysis/_snapshots/_meta.json",
  /** User portfolio audit contact submissions */
  portfolioRequest: (slugName: string, timestamp: string) =>
    `requests/portfolio-audit/${timestamp}_${slug(slugName)}.json`,
  portfolioRequestPrefix: "requests/portfolio-audit/",
} as const;

export function slug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const DOC_TYPES = ["factsheet", "portfolio-disclosure", "sid-scheme-document", "annual-report", "other"] as const;
export type DocType = (typeof DOC_TYPES)[number];

/** Manifest entry describing one tracked scheme inside a category. */
export type SchemeManifestEntry = {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  schemeCategory?: string;
  firstDate: string;
  lastDate: string;
  rows: number;
  updatedAt: string;
};

export type DocumentEntry = {
  key: string;
  fundHouse: string;
  docType: DocType;
  fileName: string;
  size: number;
  uploadedAt: string;
  sourceUrl?: string;
};
