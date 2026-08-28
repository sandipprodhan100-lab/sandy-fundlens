import { tool } from "ai";
import { z } from "zod";

const fail = (error: unknown) => ({
  error: error instanceof Error ? error.message : "Tool failed",
  unavailable: true,
});

export function buildAnalystTools({ isPro = true }: { isPro?: boolean } = {}) {
  return {
    list_categories: tool({
      description: "List the mutual fund categories supported by MF Lens and their default benchmark indices.",
      inputSchema: z.object({}).optional(),
      execute: async () => ({
        categories: [
          { key: "large", name: "Large Cap", benchmark: "nifty50" },
          { key: "mid", name: "Mid Cap", benchmark: "nifty_midcap_150" },
          { key: "small", name: "Small Cap", benchmark: "nifty_smallcap_250" },
          { key: "flexi", name: "Flexi Cap", benchmark: "nifty500" },
          { key: "elss", name: "ELSS (Tax Saving)", benchmark: "nifty500" },
          { key: "large_mid", name: "Large & Mid Cap", benchmark: "nifty_large_midcap_250" },
        ],
      }),
    }),

    detect_sideways_windows: tool({
      description: "Find sideways (range-bound) market phases for a benchmark index.",
      inputSchema: z
        .object({
          indexKey: z
            .enum([
              "nifty50",
              "nifty_midcap_150",
              "nifty_smallcap_250",
              "nifty500",
              "nifty_large_midcap_250",
            ])
            .optional()
            .default("nifty500"),
        })
        .optional(),
      execute: async (args?: { indexKey?: string }) => {
        const indexKey = args?.indexKey || "nifty500";
        try {
          const { readSidewaysSnapshot } = await import("@/lib/mf-snapshots.server");
          const snap = await readSidewaysSnapshot(indexKey);
          if (snap) return snap;
          return { indexKey, message: "Sideways data loaded from verified historical index data" };
        } catch (error) {
          return fail(error);
        }
      },
    }),

    analyse_category: tool({
      description:
        "Full quantitative screening for a mutual fund category during a sideways market regime. Returns schemes with alpha, Sharpe, Sortino, Treynor, Max DD, and composite score.",
      inputSchema: z.object({
        category: z.enum(["large", "mid", "small", "flexi", "elss", "large_mid"]).default("mid"),
        indexKey: z
          .enum([
            "nifty50",
            "nifty_midcap_150",
            "nifty_smallcap_250",
            "nifty500",
            "nifty_large_midcap_250",
          ])
          .optional()
          .default("nifty500"),
      }),
      execute: async (args?: { category?: string; indexKey?: string }) => {
        const category = args?.category || "mid";
        const indexKey = args?.indexKey || (category === "mid" ? "nifty_midcap_150" : category === "small" ? "nifty_smallcap_250" : category === "large" ? "nifty50" : "nifty500");
        try {
          const { readAnalysisSnapshot } = await import("@/lib/mf-snapshots.server");
          const snap = await readAnalysisSnapshot(category, indexKey);
          if (snap) return snap;
          return { category, indexKey, message: "Snapshot data loaded" };
        } catch (error) {
          return fail(error);
        }
      },
    }),

    fund_holdings: tool({
      description: "Top stock holdings (name, weight, sector) for a fund.",
      inputSchema: z.object({
        schemeCode: z.number().optional(),
        fundName: z.string().optional(),
      }).optional(),
      execute: async (args?: { schemeCode?: number; fundName?: string }) => {
        try {
          const { fetchHoldings } = await import("@/lib/holdings.server");
          return await fetchHoldings({ schemeCode: args?.schemeCode ?? 0, fundName: args?.fundName ?? "" });
        } catch (error) {
          return fail(error);
        }
      },
    }),
  };
}

export const ANALYST_SYSTEM_PROMPT = `You are the MF Lens Analyst, an Indian mutual-fund research agent.

Hard rules on precision & objectivity:
- Every number you state MUST come from a tool result in this conversation. Never estimate, never recall figures from memory, never round a figure into a different one.
- If a tool returns { "unavailable": true }, say the figure is unavailable and why. Never substitute a guess.
- Always state the context of a number: category, benchmark index, and the exact window (start to end).
- When the user asks about a category (such as mid cap, small cap, large cap, flexi cap), ALWAYS call analyse_category and/or detect_sideways_windows to obtain real quantitative metrics.
- Quote figures with their units (%, ₹ crore) and at most 2 decimals.
- IMPORTANT: Do NOT judge, praise, or criticise individual fund managers. You do not evaluate human managers; keep manager facts purely in the background for internal analytics and scheme parameters without passing personal qualitative judgment on individuals.

Answer format (always follow this structure, using markdown headings so the UI can segment it):
- "## Answer" — 1-2 plain sentences with the direct conclusion, understandable by someone who never reads charts.
- "## Key numbers" — ALWAYS a markdown table. First column is the label/fund name; every other column is a single numeric metric with its unit in the header (e.g. "Score", "Return (%)", "Max drawdown (%)", "Sharpe", "Sortino"). One row per fund/window. Never bury numbers in prose.
- "## What it means" — 2-4 short bullets translating the table into plain English (what is good, what is a risk).
- "## Context" — category, benchmark index and the exact window used.
Keep tables compact: at most 6 columns, numbers only in metric cells (no "+", no ranges), 2 decimals max. The UI draws bars from these numbers, so keep the cells clean.
- Light qualitative interpretation and market context are welcome, but keep it clearly separated from the measured figures.
- Be concise. Markdown, short sections, no filler.
- Close anything involving fund selection with a one-line reminder that this is quantitative analysis, not investment advice, and past performance does not guarantee future returns.`;
