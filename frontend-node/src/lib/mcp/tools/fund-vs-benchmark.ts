import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export default defineTool({
  name: "fund_vs_benchmark",
  title: "Fund vs benchmark series",
  description:
    "Return a rebased (start = 100) daily series comparing one fund's NAV against its benchmark index over a date window.",
  inputSchema: {
    schemeCode: z.number().int().describe("AMFI scheme code of the fund."),
    indexKey: z.enum(["nifty50", "midcap150", "smallcap250", "nifty500"]),
    start: DATE,
    end: DATE,
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ schemeCode, indexKey, start, end }) => {
    const { fundVsIndex } = await import("@/lib/mf.server");
    try {
      const result = await fundVsIndex({ code: schemeCode, indexKey, start, end });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw new ToolError(error instanceof Error ? error.message : "Series unavailable");
    }
  },
});
