import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const indexKey = z.enum(["nifty50", "midcap150", "smallcap250", "nifty500"]);
const categoryKey = z.enum(["large", "mid", "small", "multi", "flexi", "hybrid"]);
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** SIP / lumpsum outcomes. Free tier gets the sideways window; Pro gets projections. */
export const analyseSipPlan = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.number(),
        indexKey,
        start: DATE,
        end: DATE,
        mode: z.enum(["sip", "lumpsum", "both"]),
        amount: z.number().min(100).max(10_000_000),
        lumpsum: z.number().min(0).max(100_000_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const [{ analyseSip }, { getViewer }] = await Promise.all([
      import("./sip.server"),
      import("./entitlement.server"),
    ]);
    const viewer = await getViewer();
    return analyseSip({ ...data, lumpsum: data.lumpsum ?? 0, deep: viewer.isPro });
  });

/** Category-wide SIP / lumpsum comparison: every fund, or just the ranked five. */
export const analyseCategorySipPlan = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: categoryKey,
        indexKey,
        start: DATE,
        end: DATE,
        mode: z.enum(["sip", "lumpsum", "both"]),
        amount: z.number().min(100).max(10_000_000),
        lumpsum: z.number().min(0).max(100_000_000).default(0),
        basis: z.enum(["ranked", "all"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const [{ categorySip }] = await Promise.all([
      import("./sip.server"),
    ]);
    const result = await categorySip({
      ...data,
      basis: data.basis,
      limit: 40,
    });
    return { ...result, locked: false };
  });

/** Sector allocation drift, 6m -> 3m -> now. Fully unlocked in Open Edition. */
export const getSectorDriftFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ schemeCode: z.number(), fundName: z.string().min(3) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getSectorDrift } = await import("./sector-history.server");
    const drift = await getSectorDrift(data);
    return { ...drift, locked: false };
  });

/** Stocks common to the top ranked funds of a category. Fully unlocked. */
export const getCommonHoldings = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ category: categoryKey, indexKey, start: DATE, end: DATE }).parse(input),
  )
  .handler(async ({ data }) => {
    const { commonHoldings } = await import("./overlap.server");
    const result = await commonHoldings(data);
    return { ...result, locked: false };
  });

/** Model portfolio. Fully unlocked in Open Edition. */
export const getModelPortfolio = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        profile: z.enum(["conservative", "balanced", "aggressive"]),
        monthly: z.number().min(500).max(10_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { buildPortfolio } = await import("./portfolio.server");
    const result = await buildPortfolio({ ...data, withPicks: true });
    return { ...result, locked: false };
  });

