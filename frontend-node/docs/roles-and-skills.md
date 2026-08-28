# Roles and Skills Map

This is the end-to-end ownership map for MF Lens. It distinguishes the production
Cloudflare/TanStack application from the separately deployable FastAPI service.

## Operating planes

```mermaid
graph LR
  USER[Investor / admin] --> WEB[Cloudflare Worker: TanStack Start]
  WEB --> FN[Typed server functions]
  WEB --> CHAT[/api/chat: Gemini-backed analyst]
  FN --> ANALYTICS[Analytics engines]
  ANALYTICS --> LAKE[(S3 Parquet NAV lake)]
  WEB --> AUTH[(Supabase Auth, roles, entitlements)]
  WEB --> PAY[Paddle webhooks]
  WEB --> MAIL[Resend contact delivery]
  MCP[MCP client] --> WEB
  FASTAPI[FastAPI + Gemini ReAct service] --> PYLAKE[(S3 or local Parquet lake)]
```

| Plane | Status | Responsibility |
|---|---|---|
| Cloudflare/TanStack Start | Production | Portfolio, fund-analysis UI, chat analyst, MCP, auth, payments, storage administration, scheduled ingest endpoints and email contact form. |
| FastAPI | Separately deployable | Python NAV ingest, REST analytics endpoints, and a two-stage Gemini analyst/compliance workflow. It is not the current browser chat request path. |
| Shared data and identity services | Production dependency | Object-store data lake is authoritative for NAV and documents; Supabase holds identity, roles, entitlement, chat persistence and payment state. |

## Human delivery roles

| Role | Owns | Primary implementation and runbook |
|---|---|---|
| CIO / Product and risk owner | Product scope, analytics-as-research positioning, KPIs, data and compliance risk acceptance. | `docs/roles/cio.md` |
| CTO / Engineering owner | Technology direction, boundaries between web, data, provider adapters and operating costs. | `docs/roles/cto.md` |
| Solution and data architect | Canonical lake layout, category and benchmark modeling, deterministic analytics design and extension decisions. | `docs/roles/architect.md`, `src/lib/s3-layout.ts`, `src/lib/mf-catalog.ts` |
| Frontend and server-function developer | TanStack routes, UI panels, typed RPC boundaries, client/server separation and graceful degradation. | `docs/roles/developer.md`, `src/routes`, `src/components`, `src/lib/*.functions.ts` |
| Data engineer | AMFI ingestion, Parquet manifests, snapshot computation, document harvest and fact extraction. | `src/lib/amfi.server.ts`, `src/lib/nav-parquet.server.ts`, `scripts/precompute-snapshots.mts`, `src/lib/doc-harvest.server.ts` |
| Quantitative analytics engineer | Sideways-window detection, fund eligibility and ranking, risk ratios, combined screens, dip scans and SIP simulations. | `src/lib/mf.server.ts`, `src/lib/mf-multi.server.ts`, `src/lib/sip.server.ts` |
| AI / agent engineer | Grounded analyst responses, model gateway configuration, query intent, prompt rules and MCP tool contracts. | `src/routes/api/chat.ts`, `src/lib/ai-gateway.server.ts`, `src/lib/agent-tools.server.ts`, `src/lib/mcp` |
| Security and compliance owner | Supabase role/RLS controls, anti-advice guardrails, webhook validation, CSRF/CSP controls and secret handling. | `src/start.ts`, `supabase/migrations`, `backend-fastapi/app/agents/roles/compliance.md` |
| Platform / network engineer | Cloudflare routes, DNS, Worker secrets, egress dependencies, scheduler authentication and connectivity. | `docs/roles/network-engineer.md`, `wrangler.jsonc` |
| Release manager / SRE | Build and deployment gates, smoke tests, rollback, data freshness and incident runbooks. | `docs/roles/release-manager.md`, `infrastructure` |
| QA engineer | Unit, integration, end-to-end, data-quality and regression coverage. | `docs/roles/tester.md` |

## Executable skills

### Production analyst and MCP skills

| Skill / tool | What it does | Runtime path |
|---|---|---|
| `list_categories` | Lists supported mutual-fund categories and benchmark proxies. | `src/lib/mcp/tools/list-categories.ts` |
| `detect_sideways_windows` | Detects qualifying range-bound benchmark periods. | `src/lib/mcp/tools/sideways-windows.ts` -> `src/lib/mf.server.ts` |
| `analyse_category` | Ranks a category for a detected or chosen window using returns, alpha and risk metrics. | `src/lib/mcp/tools/analyse-category.ts` -> `src/lib/mf.server.ts` |
| `fund_vs_benchmark` | Provides a rebased fund versus index comparison series. | `src/lib/mcp/tools/fund-vs-benchmark.ts` |
| `fund_holdings` | Retrieves holdings, sector weights, source and as-of date. | `src/lib/mcp/tools/fund-holdings.ts` -> `src/lib/holdings.server.ts` |
| `fund_manager` | Retrieves fund manager and AUM facts from stored factsheets or named public sources. | `src/lib/mcp/tools/fund-manager.ts` -> `src/lib/fund-profile.server.ts` |
| `Value Research / Morningstar ratings` | Reads independently published ratings when configured; explicitly returns unrated otherwise. | `src/lib/ratings.server.ts`, `src/lib/ratings.functions.ts`, `src/components/FundRatings.tsx` |
| Chat analyst | Authenticated, grounded response using current sideways windows and the selected fund screen; has a deterministic fallback. | `src/routes/api/chat.ts` |
| Scheduled category digest | Creates and persists category digest content under shared-secret scheduler authentication. | `src/routes/api/public/agent/digest.ts` -> `src/lib/digest.server.ts` |
| Contact delivery | Persists contact request and delivers it through Resend to the configured recipient. | `src/lib/contact.functions.ts` |

### FastAPI agent skills

| Skill / role | What it does | Runtime path |
|---|---|---|
| Quantitative Synthesis Agent | Gemini ReAct loop that invokes Python category, sideways-window and performance skills. | `backend-fastapi/app/agents/engine.py`, `roles/analyst.md` |
| SEBI Compliance Guardrail Agent | Sanitizes advisory language from the draft analysis. | `backend-fastapi/app/agents/engine.py`, `roles/compliance.md` |
| `list_categories` | Returns the Python category and index catalog. | `backend-fastapi/app/agents/skills/finance_skills.py` |
| `get_sideways_windows_for_index` | Runs Python sideways-window detection. | `backend-fastapi/app/agents/skills/finance_skills.py` |
| `analyse_category_performance` | Ranks available Python data-lake schemes for a requested window. | `backend-fastapi/app/agents/skills/finance_skills.py` |

## End-to-end workflows

### Fund analysis

1. The web UI calls a typed server function in `src/lib/mf.functions.ts`.
2. The analytics engine loads benchmark and scheme NAV history from Parquet first, then falls back to the public NAV feed.
3. It detects sideways windows and computes eligibility, return, alpha, drawdown, volatility, Sharpe, Sortino, Treynor, capture and consistency measures.
4. The UI renders rankings, charts, calculators, portfolio sleeves and reports. Pro-only results are restricted in server code.

### AI analyst

1. An authenticated user submits a message to `/api/chat`.
2. The route validates identity, optionally records usage/history in Supabase, resolves category and current sideways context, then loads the most recent available analysis.
3. It enriches the leading schemes with Value Research and Morningstar data only when those publishers expose it.
4. Gemini receives grounded metrics and returns the structured answer. If model generation fails, a query-aware quantitative fallback is returned instead.
5. The response is optionally persisted to `agent_threads` and `agent_messages`.

### Data operations

1. Scheduled or admin-triggered ingest downloads daily AMFI NAV data.
2. The system maintains immutable raw files, normalised Parquet per scheme and manifests per category.
3. Snapshot generation computes frequently used sideways windows and category results.
4. Document harvesting stores AMC disclosures; fact extraction creates structured manager and AUM facts.
5. Operations write logs to the data lake and expose overview/status in the admin storage route.

### Paid access and administration

1. Supabase Auth establishes the user identity.
2. Paddle-signed webhooks write purchase/subscription state.
3. Server-side entitlement functions enforce free, pro and administrator behavior.
4. Administrators can run lake jobs and manage stored documents through protected server functions.

## Shared engineering skill

`docs/ai-skill.md` defines the cross-role **mf-lens-operator** skill. It is the required common rule set for changes: preserve server-side entitlement enforcement, treat the lake as authoritative, make ingest idempotent, use source-traceable numbers, keep secrets inside handlers and define graceful failure behavior.

## Current integration boundaries to keep explicit

- The browser chat route uses the TypeScript analyst implementation, not the FastAPI `/api/v1/analyst` endpoint. Do not assume changes to one automatically affect the other.
- FastAPI and the Cloudflare Worker each contain their own analytics and agent implementations. Treat this as intentional dual-runtime support until one path is formally retired or made the single source of truth.
- Value Research and Morningstar ratings are best-effort public-source enrichment. They are not generated by MF Lens and must never be inferred when unavailable.
- Current production deployment is Cloudflare Worker based (`wrangler.jsonc`); the VPS/Docker/Nginx material under `infrastructure` supports an alternate deployment topology and needs its own current-environment validation before use.

## Change checklist

1. Assign an owner from the human delivery roles above.
2. Identify the executable skill(s) affected and retain their server/data boundaries.
3. Update the relevant role guide and this map when the ownership or request path changes.
4. Run targeted tests plus `npm run build`; use the QA and release-manager checklists before production deployment.
