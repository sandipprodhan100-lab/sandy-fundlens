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
    const [{ categorySip }, { getViewer }] = await Promise.all([
      import("./sip.server"),
      import("./entitlement.server"),
    ]);
    const viewer = await getViewer();
    const basis = viewer.isPro ? data.basis : "ranked";
    const result = await categorySip({
      ...data,
      basis,
      limit: viewer.isPro ? 40 : 3,
    });
    return { ...result, locked: !viewer.isPro };
  });

/** Sector allocation drift, 6m -> 3m -> now. Free tier gets the headline only. */
export const getSectorDriftFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ schemeCode: z.number(), fundName: z.string().min(3) }).parse(input),
  )
  .handler(async ({ data }) => {
    const [{ getSectorDrift }, { getViewer }] = await Promise.all([
      import("./sector-history.server"),
      import("./entitlement.server"),
    ]);
    const [drift, viewer] = await Promise.all([getSectorDrift(data), getViewer()]);
    if (viewer.isPro) return { ...drift, locked: false };
    const top = [...drift.rows]
      .filter((r) => r.change != null)
      .sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
    const headline = [top[0], top[top.length - 1]].filter(
      (r, i, arr): r is NonNullable<typeof r> => !!r && arr.indexOf(r) === i,
    );
    return { ...drift, rows: headline, locked: true };
  });

/** Stocks common to the top ranked funds of a category. Free tier sees three. */
export const getCommonHoldings = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ category: categoryKey, indexKey, start: DATE, end: DATE }).parse(input),
  )
  .handler(async ({ data }) => {
    const [{ commonHoldings }, { getViewer }] = await Promise.all([
      import("./overlap.server"),
      import("./entitlement.server"),
    ]);
    const [result, viewer] = await Promise.all([commonHoldings(data), getViewer()]);
    if (viewer.isPro) return { ...result, locked: false };
    return {
      ...result,
      stocks: result.stocks.slice(0, 3).map((s) => ({
        ...s,
        weights: {} as Record<number, number | null>,
      })),
      locked: true,
    };
  });

/** Model portfolio. Free tier sees the allocation, Pro sees the fund picks. */
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
    const [{ buildPortfolio }, { getViewer }] = await Promise.all([
      import("./portfolio.server"),
      import("./entitlement.server"),
    ]);
    const viewer = await getViewer();
    const result = await buildPortfolio({ ...data, withPicks: viewer.isPro });
    return { ...result, locked: !viewer.isPro };
  });
