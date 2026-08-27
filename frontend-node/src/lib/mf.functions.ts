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
    const backendUrl = process.env["BACKEND_API_URL"] || "http://localhost:8000";
    const url = new URL(`${backendUrl}/api/v1/sideways/${data.indexKey}`);
    if (data.bandPct !== undefined) url.searchParams.set("band_pct", String(data.bandPct));
    if (data.minDays !== undefined) url.searchParams.set("min_days", String(data.minDays));
    if (data.maxDrift !== undefined) url.searchParams.set("max_drift", String(data.maxDrift));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("FastAPI sideways request failed");
    const result = await res.json();

    const [{ getViewer }] = await Promise.all([
      import("./entitlement.server"),
    ]);
    const viewer = await getViewer();
    // Free/anonymous callers only get the most recent sideways window.
    if (viewer.isPro) return result;
    return { ...result, windows: result.windows.slice(0, 1) };
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
    const [{ analyse, detectSideways }, { getViewer }] = await Promise.all([
      import("./mf.server"),
      import("./entitlement.server"),
    ]);
    const viewer = await getViewer();
    if (!viewer.isPro) {
      // Free tier: only the most recent detected sideways window, no custom ranges.
      const { windows } = await detectSideways(data.indexKey);
      const free = windows[0];
      if (!free || free.start !== data.start || free.end !== data.end) {
        throw new Error("Custom date ranges require an active MF Lens Pro plan.");
      }
    }
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
    const backendUrl = process.env["BACKEND_API_URL"] || "http://localhost:8000";
    const res = await fetch(`${backendUrl}/api/v1/admin/settings`);
    if (!res.ok) throw new Error("Failed to get admin settings from backend");
    return await res.json();
  });

export const updateAdminSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ timescaledb_sync_years: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const backendUrl = process.env["BACKEND_API_URL"] || "http://localhost:8000";
    const res = await fetch(`${backendUrl}/api/v1/admin/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update admin settings on backend");
    return await res.json();
  });

