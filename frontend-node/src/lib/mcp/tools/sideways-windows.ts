import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "detect_sideways_windows",
  title: "Detect sideways benchmark windows",
  description:
    "Detect range-bound (sideways) periods for a benchmark index: at least 90 days, price band within 10% and absolute drift within 5%.",
  inputSchema: {
    indexKey: z
      .enum(["nifty50", "midcap150", "smallcap250", "nifty500"])
      .describe("Benchmark index to scan."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ indexKey }) => {
    const { detectSideways } = await import("@/lib/mf.server");
    const result = await detectSideways(indexKey);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  },
});
