import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export default defineTool({
  name: "analyse_category",
  title: "Rank funds in a category",
  description:
    "Rank funds in a category over a date window against a benchmark. Returns window/sideways stats, the top 5 ranked funds and the full screened leaderboard with alpha, Sharpe/Sortino/Treynor, CAGR, drawdown behaviour and style box.",
  inputSchema: {
    category: z
      .enum(["large", "mid", "small", "multi", "flexi", "hybrid"])
      .describe("Fund category to screen."),
    indexKey: z
      .enum(["nifty50", "midcap150", "smallcap250", "nifty500"])
      .describe("Benchmark index to compare against."),
    start: DATE.describe("Window start date (YYYY-MM-DD)."),
    end: DATE.describe("Window end date (YYYY-MM-DD)."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(60)
      .optional()
      .describe("How many leaderboard rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ category, indexKey, start, end, limit }) => {
    const { analyse } = await import("@/lib/mf.server");
    let result;
    try {
      result = await analyse({ category, indexKey, start, end });
    } catch (error) {
      throw new ToolError(error instanceof Error ? error.message : "Analysis failed");
    }
    const rows = result.funds.slice(0, limit ?? 20);
    const payload = {
      category: result.category,
      indexKey: result.indexKey,
      indexLabel: result.indexLabel,
      start: result.start,
      end: result.end,
      indexReturn: result.indexReturn,
      indexDrift: result.indexDrift,
      analysed: result.analysed,
      window: result.window,
      top5: rows.slice(0, 5).map((f) => f.name),
      funds: rows,
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload as unknown as Record<string, unknown>,
    };
  },
});
