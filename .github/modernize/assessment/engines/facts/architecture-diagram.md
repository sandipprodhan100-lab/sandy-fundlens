# Architecture Diagram

FundLens is a mutual fund analytics monorepo with a production TanStack Start web application, a separately deployable FastAPI analytics service, and an Airflow, S3, Snowflake, and dbt data platform. The diagrams below distinguish the browser request path from the independent Python service and scheduled analytical pipeline.

## Application Architecture

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart TD
    subgraph ClientLayer["Client Layer"]
        Browser["Web Browser"]
        Analyst["Analyst or MCP Client"]
    end
    subgraph WebLayer["Production Web Application"]
        TanStack["TanStack Start and React"]
        ServerFns["Typed Server Functions"]
        WebAnalytics["TypeScript Analytics and Agent Tools"]
        Auth["Supabase Auth and Entitlements"]
    end
    subgraph ApiLayer["Separate Python API"]
        FastAPI["FastAPI REST API"]
        PyAnalytics["Python Metrics and NAV Analysis"]
        PyAgent["Gemini ReAct Analyst and Compliance"]
    end
    subgraph LakeLayer["Operational Data Lake"]
        S3Raw[("AWS S3 Raw NAV Files")]
        S3Parquet[("AWS S3 Parquet and Manifests")]
        Postgres[("PostgreSQL Fund and Agent State")]
        Redis[("Redis Cache")]
    end
    subgraph WarehouseLayer["Analytical Warehouse"]
        Snowpipe["Snowflake Snowpipe"]
        Snowflake[("Snowflake Warehouse")]
        DBT["dbt Staging and Gold Marts"]
    end
    subgraph OrchestrationLayer["Orchestration and Delivery"]
        Airflow["Airflow on EC2"]
        GitHubActions["GitHub Actions Schedules"]
    end
    subgraph ExternalLayer["External Services"]
        AMFI["AMFI NAV Feed"]
        Gemini["Google Gemini API"]
        Paddle["Paddle Billing"]
        Resend["Resend Email"]
    end

    Browser -->|"HTTPS web requests"| TanStack
    Analyst -->|"HTTPS and MCP requests"| TanStack
    TanStack -->|"server calls"| ServerFns
    ServerFns -->|"analysis and tools"| WebAnalytics
    ServerFns -->|"identity checks"| Auth
    WebAnalytics -->|"read and write lake data"| S3Parquet
    WebAnalytics -->|"persist state"| Postgres
    WebAnalytics -->|"cache hot results"| Redis
    WebAnalytics -->|"model generation"| Gemini
    ServerFns -->|"payment events"| Paddle
    ServerFns -->|"contact delivery"| Resend

    FastAPI -->|"REST endpoints"| PyAnalytics
    FastAPI -->|"analyst endpoint"| PyAgent
    PyAnalytics -->|"read NAV series"| S3Parquet
    PyAnalytics -->|"read and write hot window"| Postgres
    PyAgent -->|"tool calls and verification"| Gemini

    AMFI -->|"daily NAV text"| GitHubActions
    GitHubActions -->|"trigger ingest"| FastAPI
    FastAPI -->|"raw archive"| S3Raw
    FastAPI -->|"curated Parquet"| S3Parquet
    Airflow -->|"wait for curated files"| S3Parquet
    Airflow -->|"refresh pipe"| Snowpipe
    Snowpipe -->|"load raw records"| Snowflake
    Airflow -->|"run transformations"| DBT
    DBT -->|"build staging and marts"| Snowflake
~~~

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Web UI | React, TanStack Start, Vite, TypeScript | React 19, TanStack Start 1.168, Vite 8, TypeScript 5.8 | Browser UI, SSR, routing, and server functions |
| Web analytics | TypeScript domain engines, React Query, Parquet readers | Current package versions | Fund ranking, sideways-window analysis, reports, and MCP tools |
| Python API | FastAPI, Uvicorn, Pydantic | FastAPI 0.100+, Uvicorn 0.22+, Pydantic 2+ | REST analytics, ingestion, administration, and separate analyst workflow |
| Python analytics | Pandas, NumPy, PyArrow, SQLAlchemy | Pandas 2+, NumPy 1.24+, PyArrow 12+, SQLAlchemy 2+ | NAV processing, metrics, Parquet access, and relational persistence |
| Web deployment | Cloudflare Workers and TanStack server runtime | Configuration-defined | Production frontend and server-function hosting |
| Object storage | AWS S3 and Apache Parquet | S3 compatible | Raw AMFI archives, curated NAV history, manifests, documents, and snapshots |
| Operational database | PostgreSQL with SQLAlchemy models | PostgreSQL 15 in production compose | Funds, NAV hot window, rankings, agent threads, and settings |
| Cache | Redis | Redis 7 in production compose | Optional runtime cache for deployed services |
| Orchestration | Apache Airflow on AWS EC2 | Configuration-defined | Scheduled S3 checks, Snowpipe refresh, dbt execution, and data tests |
| Warehouse | Snowflake and Snowpipe | Configuration-defined | Raw landing, continuous ingestion, and analytical storage |
| Transformation | dbt Core with dbt Snowflake | Configuration-defined | Silver staging views, gold dimensions, and incremental facts |
| AI | Google Gemini API | Gemini 1.5 Pro and Flash in code | Tool-using analysis and compliance-oriented response cleanup |

### Data Storage & External Services

AWS S3 is the authoritative object store for raw AMFI downloads, curated per-scheme Parquet partitions, manifests, documents, and snapshots. PostgreSQL stores the operational hot NAV window, fund metadata, rankings, agent conversations, digests, and administrative settings; Redis is available as a deployment cache. The scheduled data platform loads curated S3 data through Snowflake Snowpipe and transforms it with dbt into silver staging views and gold dimensional or incremental fact models. AMFI supplies daily NAV data, Gemini provides the two agent runtimes, and Paddle and Resend support billing and contact delivery in the production web application.

### Key Architectural Decisions

- Keeps the production TypeScript request path separate from the independently deployable FastAPI service while sharing the S3 data lake contract.
- Uses Parquet in object storage for historical NAV scans and PostgreSQL for operational, relational, and recent hot-window state.
- Uses an Airflow-managed Snowpipe and dbt pipeline to turn curated lake files into tested Snowflake analytical marts.

## Component Relationships

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart LR
    subgraph cPresentation["Presentation"]
        cRoutes["TanStack Routes"]
        cChat["Chat and Analyst Routes"]
        cAdmin["Admin Storage Routes"]
        cApiRouter["FastAPI API Router"]
    end
    subgraph cBusiness["Business Logic"]
        cServerFns["Server Function Handlers"]
        cMfEngine["Fund Analytics Engine"]
        cMcpTools["MCP Tool Surface"]
        cPyCalculations["Python Calculations"]
        cAgentEngine["Gemini Agent Engine"]
        cCompliance["Compliance Prompt Guard"]
    end
    subgraph cData["Data Access"]
        cNavParquet["NAV Parquet Manager"]
        cS3Connector["S3 Connector"]
        cDbConnection["SQLAlchemy Connection"]
        cModels["Fund and Agent Models"]
        cSnowflake["Snowflake Raw and Gold Models"]
    end
    subgraph cInfra["Infrastructure"]
        cAuth["Supabase Auth and RLS"]
        cAmfi["AMFI Scraper"]
        cAirflow["Airflow ELT DAG"]
        cDbt["dbt Staging and Marts"]
        cSnowpipe["Snowpipe External Stage"]
    end

    cRoutes -->|"calls"| cServerFns
    cChat -->|"calls"| cServerFns
    cAdmin -->|"calls"| cServerFns
    cServerFns -->|"authorizes"| cAuth
    cServerFns -->|"runs"| cMfEngine
    cServerFns -->|"exposes"| cMcpTools
    cMcpTools -->|"delegates"| cMfEngine
    cMfEngine -->|"reads series"| cNavParquet
    cNavParquet -->|"object operations"| cS3Connector
    cServerFns -->|"persists threads"| cDbConnection
    cDbConnection -->|"maps entities"| cModels

    cApiRouter -->|"dispatches"| cPyCalculations
    cApiRouter -->|"dispatches analyst"| cAgentEngine
    cApiRouter -->|"ingests data"| cAmfi
    cPyCalculations -->|"reads NAV"| cNavParquet
    cPyCalculations -->|"reads hot data"| cDbConnection
    cAgentEngine -->|"invokes tools"| cPyCalculations
    cAgentEngine -->|"passes draft"| cCompliance
    cAmfi -->|"writes raw and curated"| cS3Connector
    cAmfi -->|"syncs recent rows"| cDbConnection

    cAirflow -->|"senses curated files"| cSnowpipe
    cSnowpipe -->|"loads raw records"| cSnowflake
    cAirflow -->|"runs"| cDbt
    cDbt -->|"builds"| cSnowflake
    cSnowflake -.->|"analytical warehouse boundary"| cMfEngine
~~~

### Component Inventory

| Component | Layer | Type | Responsibility |
|---|---|---|---|
| TanStack Routes | Presentation | React route tree | Renders the browser application and initiates server calls |
| Chat and Analyst Routes | Presentation | Route handlers | Handles the production AI analyst request path |
| Admin Storage Routes | Presentation | Protected routes | Exposes storage, ingest, and operational administration |
| FastAPI API Router | Presentation | Python API router | Serves REST endpoints for health, ingest, metrics, settings, and analyst requests |
| Server Function Handlers | Business Logic | TanStack server functions | Enforces request boundaries and coordinates production workflows |
| Fund Analytics Engine | Business Logic | TypeScript domain engine | Detects sideways windows and ranks funds using NAV and risk metrics |
| MCP Tool Surface | Business Logic | MCP tools | Exposes analysis capabilities to compatible clients and agent workflows |
| Python Calculations | Business Logic | Python service module | Computes NAV series, metrics, sideways windows, and category analysis |
| Gemini Agent Engine | Business Logic | Tool-calling agent | Runs a bounded Gemini tool loop for the FastAPI analyst endpoint |
| Compliance Prompt Guard | Business Logic | Agent stage | Reviews and sanitizes the generated analysis for advisory language |
| NAV Parquet Manager | Data Access | Storage adapter | Reads manifests and per-scheme NAV Parquet data |
| S3 Connector | Data Access | Object-store adapter | Reads and writes raw files, Parquet partitions, manifests, and documents |
| SQLAlchemy Connection | Data Access | Database session layer | Creates relational sessions for operational reads and writes |
| Fund and Agent Models | Data Access | ORM models | Represents funds, NAV history, rankings, threads, messages, and settings |
| Snowflake Raw and Gold Models | Data Access | Warehouse tables | Stores Snowpipe landing data and dbt-produced analytical models |
| Supabase Auth and RLS | Infrastructure | Identity and policy service | Handles identity, roles, entitlements, and row-level access policies |
| AMFI Scraper | Infrastructure | Ingestion adapter | Downloads, parses, classifies, and persists daily AMFI NAV data |
| Airflow ELT DAG | Infrastructure | Scheduled orchestrator | Coordinates S3 checks, Snowpipe refresh, dbt runs, and dbt tests |
| dbt Staging and Marts | Infrastructure | Transformation project | Builds silver views, gold dimensions, and incremental facts in Snowflake |
| Snowpipe External Stage | Infrastructure | Warehouse ingestion | Loads curated S3 files into Snowflake raw staging |