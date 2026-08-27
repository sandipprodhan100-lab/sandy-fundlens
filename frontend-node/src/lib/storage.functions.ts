import { createServerFn } from "@tanstack/react-start";
import type { CategoryKey } from "@/lib/mf-catalog";
import type { DocType } from "@/lib/s3-layout";

/** Admin-only storage console: everything here touches the S3 data lake. */

export const getStorageOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { requireStorageAdmin } = await import("@/lib/entitlement.server");
  await requireStorageAdmin();

  const { navLakeStatus, readManifest } = await import("@/lib/nav-parquet.server");
  const { documentsStatus } = await import("@/lib/docs-store.server");
  const { readAppConfig } = await import("@/lib/app-config.server");
  const { s3List } = await import("@/lib/s3.server");
  const { S3_PATHS } = await import("@/lib/s3-layout");
  const { CATEGORIES } = await import("@/lib/mf-catalog");

  const { factsStatus } = await import("@/lib/doc-facts.server");

  const [nav, docs, config, rawDaily, logs, facts] = await Promise.all([
    navLakeStatus(),
    documentsStatus().catch(() => ({ files: 0, bytes: 0, houses: 0 })),
    readAppConfig(),
    s3List(S3_PATHS.navRawPrefix, 400).catch(() => []),
    s3List(S3_PATHS.ingestLogPrefix(), 200).catch(() => []),
    factsStatus().catch(() => ({ schemes: 0, houses: 0, withAum: 0, withManager: 0, documents: 0 })),
  ]);

  const categories = await Promise.all(
    CATEGORIES.map(async (c) => {
      const manifest = await readManifest(c.key).catch(() => []);
      return {
        key: c.key,
        label: c.label,
        schemes: manifest.length,
        rows: manifest.reduce((sum, m) => sum + m.rows, 0),
        lastDate: manifest.map((m) => m.lastDate).sort().at(-1) ?? null,
      };
    }),
  );

  return {
    nav,
    docs,
    facts,
    config,
    categories,
    rawDailyFiles: rawDaily.length,
    lastRawDaily: rawDaily.map((o) => o.key).sort().at(-1) ?? null,
    lastLogs: logs
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified))
      .slice(0, 8)
      .map((o) => ({ key: o.key, at: o.lastModified })),
  };
});

export const runIngestJob = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { job: "daily-nav" | "backfill" | "backfill-index" | "migrate"; category?: CategoryKey; limit?: number }) =>
      input,
  )
  .handler(async ({ data }) => {
    const { requireStorageAdmin } = await import("@/lib/entitlement.server");
    await requireStorageAdmin();
    const { ingestDailyNav, backfillCategory, backfillIndexes, migrateAll } = await import("@/lib/amfi.server");
    if (data.job === "daily-nav") return ingestDailyNav();
    if (data.job === "migrate") return migrateAll(data.limit ?? 60);
    if (data.job === "backfill-index") return backfillIndexes();
    if (!data.category) throw new Error("Pick a category to backfill.");
    return backfillCategory(data.category, data.limit ?? 40);
  });

/** Download every published factsheet / portfolio disclosure into S3. */
export const harvestDocuments = createServerFn({ method: "POST" })
  .inputValidator((input: { house?: string | undefined; perHouseLimit?: number | undefined }) => input)
  .handler(async ({ data }) => {
    const { requireStorageAdmin } = await import("@/lib/entitlement.server");
    await requireStorageAdmin();
    const { harvestFundDocuments } = await import("@/lib/doc-harvest.server");
    return harvestFundDocuments(data);
  });

/** Read AUM / fund-manager facts out of the stored PDFs. */
export const extractDocumentFacts = createServerFn({ method: "POST" })
  .inputValidator((input: { limit?: number }) => input)
  .handler(async ({ data }) => {
    const { requireStorageAdmin } = await import("@/lib/entitlement.server");
    await requireStorageAdmin();
    const { extractAllDocumentFacts } = await import("@/lib/doc-facts.server");
    return extractAllDocumentFacts(data.limit ?? 6);
  });

export const listFundHouses = createServerFn({ method: "GET" }).handler(async () => {
  const { FUND_HOUSES } = await import("@/lib/fund-houses");
  return FUND_HOUSES.map((h) => h.name);
});

export const listFundDocuments = createServerFn({ method: "GET" }).handler(async () => {
  const { requireStorageAdmin } = await import("@/lib/entitlement.server");
  await requireStorageAdmin();
  const { readDocumentIndex } = await import("@/lib/docs-store.server");
  return readDocumentIndex();
});

export const importFundDocument = createServerFn({ method: "POST" })
  .inputValidator((input: { fundHouse: string; docType: DocType; sourceUrl: string }) => {
    if (!input.fundHouse.trim()) throw new Error("Fund house is required.");
    if (!/^https:\/\//i.test(input.sourceUrl)) throw new Error("Document URL must be https.");
    return input;
  })
  .handler(async ({ data }) => {
    const { requireStorageAdmin } = await import("@/lib/entitlement.server");
    await requireStorageAdmin();
    const { ingestDocumentFromUrl } = await import("@/lib/docs-store.server");
    return ingestDocumentFromUrl(data);
  });

export const getDocumentLink = createServerFn({ method: "POST" })
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    const { requireStorageAdmin } = await import("@/lib/entitlement.server");
    await requireStorageAdmin();
    const { documentDownloadUrl } = await import("@/lib/docs-store.server");
    return { url: await documentDownloadUrl(data.key) };
  });

export const saveAppConfig = createServerFn({ method: "POST" })
  .inputValidator((input: { backfillLimit?: number; dailyIngestHourIST?: number; categories?: string[] }) => input)
  .handler(async ({ data }) => {
    const { requireStorageAdmin } = await import("@/lib/entitlement.server");
    await requireStorageAdmin();
    const { writeAppConfig } = await import("@/lib/app-config.server");
    return writeAppConfig(data);
  });
