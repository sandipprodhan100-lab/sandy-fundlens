import { defineTool } from "@lovable.dev/mcp-js";

import { CATEGORIES, INDEXES } from "@/lib/mf-catalog";

export default defineTool({
  name: "list_categories",
  title: "List fund categories and benchmarks",
  description:
    "List the supported fund categories (large, mid, small, multi, flexi cap) and the benchmark indices with their default pairing.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const payload = {
      categories: CATEGORIES.map((c) => ({
        key: c.key,
        label: c.label,
        defaultIndex: c.defaultIndex,
      })),
      indexes: INDEXES.map((i) => ({ key: i.key, label: i.label, proxyFund: i.proxy })),
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
