# Architect Guide — MF Lens

## Component map

```mermaid
graph TD
  subgraph Routes
    IDX[/ landing + demo/]
    ANA[/analysis/]
    ACC[/account, /pricing, /login/]
    ADM[/admin/storage/]
    ING[/api/public/s3/ingest/]
    WH[/api/public/payments/webhook/]
    MCP[/mcp + tool routes/]
  end
  subgraph Server functions
    MFFN[mf.functions]
    STFN[storage.functions]
    PAYFN[payments.functions / purchases.functions]
  end
  subgraph Domain
    MFS[mf.server: detect + analyse]
    MULTI[mf-multi.server: combined + dips]
    PROF[fund-profile.server]
    AUM[aum.server]
    HOLD[holdings.server]
  end
  subgraph Data plane
    NAVP[nav-parquet.server]
    AMFI[amfi.server: daily ingest]
    DOCS[docs-store.server]
    HARV[doc-harvest.server]
    FACTS[doc-facts.server]
    CFG[app-config.server]
    S3[s3.server + s3-layout]
  end
  IDX & ANA --> MFFN --> MFS --> NAVP --> S3
  MFFN --> MULTI --> MFS
  MFFN --> PROF --> FACTS
  PROF --> AUM
  MFFN --> HOLD
  ADM --> STFN --> AMFI & HARV & FACTS & DOCS & CFG
  ING --> AMFI & HARV & FACTS
  MCP --> MFS
  WH --> PAYFN
```

## Data lake layout (canonical, `s3-layout.ts`)

```text
nav/parquet/category=<cat>/scheme_code=<code>/nav.parquet   full NAV history, columnar
nav/raw/amfi/dt=<YYYY-MM-DD>/NAVAll.txt                     immutable daily regulator file
nav/_manifest/<category>.json                               scheme inventory + coverage
documents/<fund_house>/<doc_type>/<file>.pdf                AMC source documents
documents/_index.json                                       document catalogue
documents/_facts/<fund_house>.json                          LLM-extracted structured facts
app/config/<name>.json                                      runtime configuration
app/logs/ingest/<job>/<timestamp>.json                      ingest run logs
app/code/<version>/...                                      code + config snapshots
app/docs/...                                                this documentation set
```

Partitioning rationale: category is the query predicate for every screen; scheme_code is
the join key. One file per scheme keeps appends cheap and avoids compaction.

## Category = partition key

`large | mid | small | multi | flexi | hybrid | index` (index holds benchmark proxies).

## Analysis pipeline

```mermaid
flowchart TD
  A[Index NAV series] --> B{Grow candidate windows<br/>from every 5th trading day}
  B --> C{≥90 days AND<br/>abs drift ≤5% AND<br/>band ≤10%?}
  C -- no --> B
  C -- yes --> D[Keep longest non-overlapping]
  D --> E[Take N most recent]
  E --> F[Screen category universe]
  F --> G[Age >3y, AUM within band of category avg,<br/>Direct+Growth, ≥80% NAV coverage]
  G --> H[Per fund: return, alpha, max drawdown,<br/>volatility, Sharpe, Sortino, Treynor,<br/>up-capture, down-capture]
  H --> I[Category-weighted percentile blend]
  I --> J[Top ranked + style-box placement]
```

## Storage decision record

| Decision | Rationale | Consequence |
|---|---|---|
| Parquet over row DB for NAV | ~10× smaller, column pruning, portable to any query engine | Needs a reader lib in the runtime |
| Object store as system of record | Vendor-portable, cheap, versionable | Eventual consistency on list operations |
| Relational DB only for identity/entitlement/state | Keeps RLS surface tiny and auditable | Two stores to operate |
| Signed URLs for object get/put | Gateway does not proxy bodies; avoids memory pressure | Clients need clock-valid short-lived URLs |
| In-memory caches, TTL-bounded | Zero infra, adequate at current traffic | Cold start recompute; move to shared cache at scale |

## Security architecture

```mermaid
graph LR
  ANON[Anonymous] -->|demo, truncated| PUB[Public routes]
  USER[Authenticated] --> RPC[Server fn + bearer middleware]
  RPC --> ENT{Pro or admin?}
  ENT -- no --> TRUNC[Truncated payload]
  ENT -- yes --> FULL[Full payload]
  ADMIN[Admin role] --> ADMFN[Storage + ingest functions]
  SCHED[Scheduler] -->|x-ingest-secret| INGEST[Public ingest route]
  PROV[Payment provider] -->|signature| WEBHOOK[Public webhook]
```

Rules: roles in `user_roles` + security-definer `has_role`; RLS on every public table with
explicit GRANTs; privileged DB client only after caller verification; secrets read inside
handlers only.

## Extension points

- **New category**: add to the catalog + config `categories`, run backfill, done.
- **New benchmark**: add an index proxy under `category=index`.
- **New document type**: extend `DOC_TYPES`, harvest patterns, and the extraction schema.
- **New agent tool**: add a module under the MCP tools folder; it inherits OAuth.
- **New metric**: compute in the engine, add a weight per category, surface in the leaderboard.
