import { tool } from "ai";
import { z } from "zod";

import { CATEGORIES, INDEXES, type CategoryKey, type IndexKey } from "@/lib/mf-catalog";

const categoryKey = z.enum(["large", "mid", "small", "multi", "flexi", "hybrid"]);
const indexKey = z.enum(["nifty50", "midcap150", "smallcap250", "nifty500"]);
const DATE = z.string().describe("ISO date, YYYY-MM-DD");

const PRO_ONLY = {
  unavailable: true,
  reason:
    "This detail is part of MF Lens Pro. Tell the user the figure is unavailable on the free tier and point them at /pricing — do not guess a value.",
};

function fail(error: unknown) {
  return {
    unavailable: true,
    reason: error instanceof Error ? error.message : "Data source unavailable right now.",
  };
}

/** compact a fund row so the model gets precise numbers without huge payloads */
function slimFund(f: Record<string, unknown>) {
  const keep = [
    "code",
    "name",
    "house",
    "score",
    "return",
    "annualised",
    "alpha",
    "maxDrawdown",
    "drawdownReturn",
    "volatility",
    "sharpe",
    "sortino",
    "treynor",
    "beta",
    "upDays",
    "aumCrore",
    "flowQ1",
    "flowQ2",
    "cagr1y",
    "cagr3y",
    "cagr5y",
    "styleBucket",
    "sizeBucket",
    "consistency",
    "windows",
    "dipPct",
    "combinedScore",
    "peakDrop",
  ];
  const out: Record<string, unknown> = {};
  for (const k of keep) if (f[k] !== undefined && f[k] !== null) out[k] = f[k];
  return out;
}

export function buildAnalystTools(opts: { isPro: boolean }) {
  const { isPro } = opts;

  return {
    list_categories: tool({
      description:
        "List the fund categories MF Lens covers and the benchmark index used for each. Call this first when the user names a category loosely.",
      inputSchema: z.object({}),
      execute: async () => ({
        categories: CATEGORIES.map((c) => ({
          key: c.key,
          label: c.label,
          defaultIndex: c.defaultIndex,
        })),
        indices: INDEXES.map((i) => ({ key: i.key, label: i.label })),
      }),
    }),

    detect_sideways_windows: tool({
      description:
        "Detect the recent sideways (flat / range-bound) windows for a benchmark index, with start, end, drift and range for each. Use it to pick a window before ranking funds.",
      inputSchema: z.object({ indexKey }),
      execute: async ({ indexKey: key }) => {
        try {
          const { detectSideways } = await import("@/lib/mf.server");
          const result = await detectSideways(key as IndexKey);
          const windows = isPro ? result.windows : result.windows.slice(0, 1);
          return { ...result, windows, freeTierLimited: !isPro };
        } catch (error) {
          return fail(error);
        }
      },
    }),

    analyse_category: tool({
      description:
        "Rank funds in a category against its benchmark over a date window. Returns window stats plus per-fund alpha, Sharpe/Sortino/Treynor, CAGR, drawdown, AUM and style box. This is the source of truth for every number you quote.",
      inputSchema: z.object({
        category: categoryKey,
        indexKey,
        start: DATE,
        end: DATE,
        limit: z.number().optional().describe("How many ranked rows to return; default 10."),
      }),
      execute: async ({ category, indexKey: key, start, end, limit }) => {
        try {
          const { analyse } = await import("@/lib/mf.server");
          const result = await analyse({
            category: category as CategoryKey,
            indexKey: key as IndexKey,
            start,
            end,
          });
          const n = Math.min(Math.max(1, Math.round(limit ?? 10)), 25);
          return {
            category: result.category,
            indexLabel: result.indexLabel,
            start: result.start,
            end: result.end,
            indexReturn: result.indexReturn,
            indexDrift: result.indexDrift,
            analysed: result.analysed,
            funds: result.funds.slice(0, n).map((f) => slimFund(f as unknown as Record<string, unknown>)),
          };
        } catch (error) {
          return fail(error);
        }
      },
    }),

    combined_ranking: tool({
      description:
        "Blend fund rankings across the last three sideways windows, rewarding consistency. Pro feature.",
      inputSchema: z.object({ category: categoryKey, indexKey }),
      execute: async ({ category, indexKey: key }) => {
        if (!isPro) return PRO_ONLY;
        try {
          const { analyseCombined } = await import("@/lib/mf-multi.server");
          const r = await analyseCombined({
            category: category as CategoryKey,
            indexKey: key as IndexKey,
          });
          return {
            indexLabel: r.indexLabel,
            windows: r.windows,
            funds: r.funds.slice(0, 15).map((f) => slimFund(f as unknown as Record<string, unknown>)),
          };
        } catch (error) {
          return fail(error);
        }
      },
    }),

    dip_radar: tool({
      description:
        "Find top-ranked funds from the latest sideways window currently trading 5-10% below their 1-year NAV peak. Pro feature.",
      inputSchema: z.object({ category: categoryKey, indexKey }),
      execute: async ({ category, indexKey: key }) => {
        if (!isPro) return PRO_ONLY;
        try {
          const { scanDips } = await import("@/lib/mf-multi.server");
          const r = await scanDips({ category: category as CategoryKey, indexKey: key as IndexKey });
          return {
            indexLabel: r.indexLabel,
            funds: (r.funds ?? [])
              .slice(0, 12)
              .map((f) => slimFund(f as unknown as Record<string, unknown>)),
          };
        } catch (error) {
          return fail(error);
        }
      },
    }),

    fund_vs_benchmark: tool({
      description:
        "Rebased fund-vs-benchmark series (both start at 100) over a window, for one scheme code.",
      inputSchema: z.object({ code: z.number(), indexKey, start: DATE, end: DATE }),
      execute: async ({ code, indexKey: key, start, end }) => {
        try {
          const { fundVsIndex } = await import("@/lib/mf.server");
          const r = (await fundVsIndex({ code, indexKey: key as IndexKey, start, end })) as {
            points?: unknown[];
          };
          const points = Array.isArray(r.points) ? r.points : [];
          // keep the payload compact: endpoints plus a sample
          return {
            ...r,
            points: points.filter((_, i) => i % Math.max(1, Math.ceil(points.length / 24)) === 0),
          };
        } catch (error) {
          return fail(error);
        }
      },
    }),

    fund_holdings: tool({
      description: "Top stock holdings (name, weight, sector) for a fund. Pro feature.",
      inputSchema: z.object({ schemeCode: z.number(), fundName: z.string() }),
      execute: async ({ schemeCode, fundName }) => {
        if (!isPro) return PRO_ONLY;
        try {
          const { fetchHoldings } = await import("@/lib/holdings.server");
          return await fetchHoldings({ schemeCode, fundName });
        } catch (error) {
          return fail(error);
        }
      },
    }),

    fund_manager: tool({
      description: "Fund manager, tenure, previous employment, other managed funds and fund size. Pro feature.",
      inputSchema: z.object({ schemeCode: z.number(), fundName: z.string() }),
      execute: async ({ schemeCode, fundName }) => {
        if (!isPro) return PRO_ONLY;
        try {
          const { fetchFundProfile } = await import("@/lib/fund-profile.server");
          return await fetchFundProfile({ schemeCode, fundName });
        } catch (error) {
          return fail(error);
        }
      },
    }),
  };
}

export const ANALYST_SYSTEM_PROMPT = `You are the MF Lens Analyst, an Indian mutual-fund research agent.

Hard rules on precision:
- Every number you state MUST come from a tool result in this conversation. Never estimate, never recall figures from memory, never round a figure into a different one.
- If a tool returns { "unavailable": true }, say the figure is unavailable and why. Never substitute a guess.
- Always state the context of a number: category, benchmark index, and the exact window (start to end).
- When the user asks about a category without a window, call detect_sideways_windows first and use the most recent sideways window, saying which one you used.
- Quote figures with their units (%, ₹ crore) and at most 2 decimals.

Answer format (always follow this structure, using markdown headings so the UI can segment it):
- "## Answer" — 1-2 plain sentences with the direct conclusion, understandable by someone who never reads charts.
- "## Key numbers" — ALWAYS a markdown table. First column is the label/fund name; every other column is a single numeric metric with its unit in the header (e.g. "Alpha (%)", "Max drawdown (%)", "AUM (Cr)"). One row per fund/window. Never bury numbers in prose.
- "## What it means" — 2-4 short bullets translating the table into plain English (what is good, what is a risk).
- "## Context" — category, benchmark index and the exact window used.
Keep tables compact: at most 6 columns, numbers only in metric cells (no "+", no ranges), 2 decimals max. The UI draws bars from these numbers, so keep the cells clean.
- Light qualitative interpretation and market context are welcome, but keep it clearly separated from the measured figures.
- Be concise. Markdown, short sections, no filler.
- Close anything involving fund selection with a one-line reminder that this is analysis, not investment advice, and past performance does not guarantee future returns.


Free tier: some tools are Pro-only. When one returns the Pro notice, tell the user plainly what is gated and that MF Lens Pro (see /pricing) unlocks it.`;
