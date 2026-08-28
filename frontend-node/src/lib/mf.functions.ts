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
    // Proxy to the FastAPI backend — the Worker's 10ms CPU limit can't handle
    // the full sideways-window detection across all schemes.
    const backendUrl = process.env["BACKEND_API_URL"] || "http://localhost:8000";
    const url = new URL(`${backendUrl}/api/v1/sideways/${data.indexKey}`);
    if (data.bandPct !== undefined) url.searchParams.set("band_pct", String(data.bandPct));
    if (data.minDays !== undefined) url.searchParams.set("min_days", String(data.minDays));
    if (data.maxDrift !== undefined) url.searchParams.set("max_drift", String(data.maxDrift));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Backend sideways request failed: ${res.status}`);
    return await res.json();
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
    // Proxy to the FastAPI backend — heavy fund analysis can't run in a Worker.
    const backendUrl = process.env["BACKEND_API_URL"] || "http://localhost:8000";
    const url = new URL(`${backendUrl}/api/v1/schemes/analysis`);
    url.searchParams.set("category", data.category);
    url.searchParams.set("index_key", data.indexKey);
    url.searchParams.set("start", data.start);
    url.searchParams.set("end", data.end);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Backend analysis request failed: ${res.status}`);
    return await res.json();
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

