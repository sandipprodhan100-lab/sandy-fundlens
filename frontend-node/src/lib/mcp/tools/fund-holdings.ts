import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "fund_holdings",
  title: "Fund top holdings",
  description:
    "Fetch the fund's top stock holdings (name, weight, sector) from public fund fact pages, with the source and as-of date when available.",
  inputSchema: {
    schemeCode: z.number().int().describe("AMFI scheme code of the fund."),
    fundName: z.string().min(3).describe("Full scheme name, e.g. 'HDFC Mid Cap Fund - Direct Growth'."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ schemeCode, fundName }) => {
    const { fetchHoldings } = await import("@/lib/holdings.server");
    try {
      const result = await fetchHoldings({ schemeCode, fundName });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw new ToolError(error instanceof Error ? error.message : "Holdings unavailable");
    }
  },
});
