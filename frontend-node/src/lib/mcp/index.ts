import { auth, defineMcp } from "@lovable.dev/mcp-js";

import analyseCategory from "./tools/analyse-category";
import fundHoldings from "./tools/fund-holdings";
import fundManager from "./tools/fund-manager";
import fundVsBenchmark from "./tools/fund-vs-benchmark";
import listCategories from "./tools/list-categories";
import sidewaysWindows from "./tools/sideways-windows";

// The OAuth issuer must be the direct Supabase auth host; the project ref is the
// only value that survives publish unchanged.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "fund-navigator",
  title: "Fund Navigator",
  version: "0.1.0",
  instructions:
    "Tools for Fund Navigator, an Indian mutual-fund analyser. Use `list_categories` to see fund categories and benchmark indices, `detect_sideways_windows` to find flat/range-bound benchmark periods, `analyse_category` to rank funds over a window (top 5 plus full leaderboard, with alpha, Sharpe/Sortino/Treynor, CAGR and style box), `fund_vs_benchmark` for a rebased fund-vs-index series, `fund_holdings` for top holdings and `fund_manager` for manager and fund-size details.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  // `exactOptionalPropertyTypes` makes the SDK's tool union reject definitions
  // that simply omit `outputSchema`; the runtime shape is correct.
  tools: [
    listCategories,
    sidewaysWindows,
    analyseCategory,
    fundVsBenchmark,
    fundHoldings,
    fundManager,
  ] as unknown as Parameters<typeof defineMcp>[0]["tools"],
});
