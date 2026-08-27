# MF Lens — System Overview (tool & environment agnostic)

MF Lens is a mutual-fund analytics platform that finds **sideways (range-bound) phases**
of an equity index and ranks the funds in a category that performed best during those
phases. It ships an in-house **S3 data lake** (NAV history in Parquet, raw regulator
downloads, AMC documents, app config/code), a **server-function API**, an **MCP agent
surface**, and a **subscription paywall**.

This documentation set is deliberately written without naming any single vendor as a
requirement. Every component is described by its *role* first, with the current concrete
implementation given as "today's binding". Any equivalent technology can be substituted.

## Documents

| Audience | File |
|---|---|
| CIO / business + risk | [roles/cio.md](roles/cio.md) |
| CTO / engineering strategy | [roles/cto.md](roles/cto.md) |
| Solution / data architect | [roles/architect.md](roles/architect.md) |
| Network / platform engineer | [roles/network-engineer.md](roles/network-engineer.md) |
| Developer | [roles/developer.md](roles/developer.md) |
| Tester / QA | [roles/tester.md](roles/tester.md) |
| Release manager / SRE | [roles/release-manager.md](roles/release-manager.md) |
| All — third-party surface | [external-dependencies.md](external-dependencies.md) |
| AI agents | [ai-skill.md](ai-skill.md) |

## Context diagram

```mermaid
graph TD
  U[Retail investor / analyst] -->|HTTPS| APP[MF Lens web app]
  AG[AI agent / LLM client] -->|MCP over HTTPS + OAuth| APP
  CRON[Scheduler] -->|POST /api/public/s3/ingest| APP

  APP --> SF[Server functions layer]
  SF --> LAKE[(Object-store data lake)]
  SF --> DB[(Relational DB: auth, roles, entitlements)]
  SF --> AI[LLM gateway - document extraction]
  SF --> PAY[Payment provider]
  SF --> NAVSRC[Regulator daily NAV feed]
  SF --> AMC[AMC websites - PDF documents]
```

## Runtime layers

```mermaid
graph LR
  subgraph Edge
    R[File-based routes + SSR]
  end
  subgraph Server
    F[*.functions.ts RPC] --> E[entitlement guard]
    E --> D[domain engines]
    D --> S[storage adapters]
  end
  subgraph Data
    P[(Parquet NAV lake)]
    RAW[(Raw regulator archives)]
    DOC[(AMC PDFs + extracted facts)]
    CFG[(App config + code snapshots)]
    SQL[(Users, roles, purchases, subscriptions, AUM snapshots)]
  end
  R --> F
  S --> P & RAW & DOC & CFG
  E --> SQL
```

## Core domain flow

```mermaid
sequenceDiagram
  participant UI
  participant FN as Server function
  participant ENG as Analysis engine
  participant LAKE as Parquet lake
  UI->>FN: analyse(category, window|auto)
  FN->>FN: verify session + entitlement
  FN->>ENG: detectSideways(index series)
  ENG->>LAKE: read index NAV history
  ENG->>LAKE: read candidate fund NAV history
  ENG->>ENG: alpha, drawdown, Sharpe/Sortino/Treynor, consistency
  ENG-->>FN: ranked funds + window rationale
  FN-->>UI: full result (Pro) or truncated preview (free)
```

## Non-negotiable invariants

1. Entitlement is enforced **server-side**; the client never decides what is paid.
2. Roles live in a dedicated `user_roles` table, never on a profile row.
3. The lake is the system of record for NAV; public feeds are top-up/fallback only.
4. Ingest endpoints are public by URL but authenticated by a shared secret header.
5. No secret is ever read at module scope — only inside a request handler.
