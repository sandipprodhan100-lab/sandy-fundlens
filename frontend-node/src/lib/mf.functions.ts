import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const indexKey = z.enum(["nifty50", "midcap150", "smallcap250", "nifty500"]);
const categoryKey = z.enum(["large", "mid", "small", "multi", "flexi", "hybrid"]);

export const getSidewaysWindows = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        indexKey,
        bandPct: z.number().optional(),
        minDays: z.number().optional(),
        maxDrift: z.number().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const isDefaultParams =
      (data.bandPct === undefined || data.bandPct === 3.0) &&
      (data.minDays === undefined || data.minDays === 90) &&
      (data.maxDrift === undefined || data.maxDrift === 5.0);

    if (isDefaultParams) {
      // Fast path: read pre-computed snapshot from S3 (single GET, ~50ms)
      const { readSidewaysSnapshot } = await import("./mf-snapshots.server");
      const snapshot = await readSidewaysSnapshot(data.indexKey);
      if (snapshot) return snapshot as any;
    }

    // Fast live computation on S3 data lake for custom band/drift parameters
    const { detectSideways } = await import("./mf.server");
    return detectSideways(data.indexKey);
  });

export const analyseFunds = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: categoryKey,
        indexKey,
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // Fast path: check pre-computed snapshot from S3
    const { readAnalysisSnapshot } = await import("./mf-snapshots.server");
    const snapshot = (await readAnalysisSnapshot(
      data.category,
      data.indexKey,
      data.start,
      data.end,
    )) as {
      start?: string;
      end?: string;
    } | null;

    if (snapshot) {
      return snapshot as any;
    }

    // Fast live computation for custom date ranges using in-process Parquet reads
    const { analyse } = await import("./mf.server");
    return analyse(data);
  });

export const getHoldings = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ schemeCode: z.number(), fundName: z.string().min(3) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requirePro } = await import("./entitlement.server");
    await requirePro();
    const { fetchHoldings } = await import("./holdings.server");
    return fetchHoldings(data);
  });

export const getFundProfile = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ schemeCode: z.number(), fundName: z.string().min(3) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requirePro } = await import("./entitlement.server");
    await requirePro();
    const { fetchFundProfile } = await import("./fund-profile.server");
    return fetchFundProfile(data);
  });

export const getCategorySizes = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        funds: z
          .array(z.object({ code: z.number(), name: z.string(), house: z.string() }))
          .min(1)
          .max(80),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { fetchCategorySizes } = await import("./fund-profile.server");
    return fetchCategorySizes(data.funds);
  });

export const getFundVsIndex = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.number(),
        indexKey,
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { fundVsIndex } = await import("./mf.server");
    return fundVsIndex(data);
  });

export const analyseCombinedWindows = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ category: categoryKey, indexKey }).parse(input))
  .handler(async ({ data }) => {
    const { requirePro } = await import("./entitlement.server");
    await requirePro();

    // Fast-path: S3 pre-computed combined snapshot (sub-50ms)
    const { readCombinedSnapshot } = await import("./mf-snapshots.server");
    const snapshot = await readCombinedSnapshot(data.category, data.indexKey);
    if (snapshot) {
      return snapshot as import("./mf-catalog").CombinedResult;
    }

    const { analyseCombined } = await import("./mf-multi.server");
    return analyseCombined(data);
  });


export const scanDipFunds = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ category: categoryKey, indexKey }).parse(input))
  .handler(async ({ data }) => {
    const { requirePro } = await import("./entitlement.server");
    await requirePro();
    const { scanDips } = await import("./mf-multi.server");
    return scanDips(data);
  });

export const getAdminSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    // Read from S3 config instead of Render backend
    const { s3GetJSON } = await import("./s3.server");
    const { S3_PATHS } = await import("./s3-layout");
    const settings = await s3GetJSON<{ timescaledb_sync_years: string }>(S3_PATHS.config("admin-settings"));
    return settings ?? { timescaledb_sync_years: "3" };
  });

export const updateAdminSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ timescaledb_sync_years: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { s3PutJSON } = await import("./s3.server");
    const { S3_PATHS } = await import("./s3-layout");
    await s3PutJSON(S3_PATHS.config("admin-settings"), data);
    return { status: "success", ...data };
  });
