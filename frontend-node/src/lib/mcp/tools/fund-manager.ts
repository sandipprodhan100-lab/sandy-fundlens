import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "fund_manager",
  title: "Fund manager and fund size",
  description:
    "Fetch the fund's manager details (tenure, designation, previous employers, other schemes managed) plus the fund's AUM, scraped from public fund pages.",
  inputSchema: {
    schemeCode: z.number().int().describe("AMFI scheme code of the fund."),
    fundName: z.string().min(3).describe("Full scheme name."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ schemeCode, fundName }) => {
    const { fetchFundProfile } = await import("@/lib/fund-profile.server");
    try {
      const result = await fetchFundProfile({ schemeCode, fundName });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw new ToolError(error instanceof Error ? error.message : "Profile unavailable");
    }
  },
});
