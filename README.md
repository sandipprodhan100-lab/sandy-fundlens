# Fund Navigator — Enterprise-Grade Agentic Mutual Fund Analytics

Fund Navigator is a high-performance quantitative analytics platform for evaluating mutual fund outperformance during range-bound (sideways) market phases. Built to showcase enterprise-grade Agentic AI and time-series data architectures, this project decouples performance calculations, storage partitions, and compliance-guarded LLM synthesis.

---

## Architecture Blueprint

The system is designed as a modular monorepo to avoid monolithic coupling and ensure independent scaling of data scraping, numeric calculations, and user interfaces.

```mermaid
flowchart TD
    subgraph Frontend [Node.js Environment]
        NextJS[Next.js 15 Web App]
        Recharts[Recharts SVG Engine]
        NextJS --> Recharts
    end

    subgraph Backend [Python Environment]
        FastAPI[FastAPI Router v1]
        Ingest[AMFI Scraper Job]
        AgentEngine[Lightweight Agent Engine]
        
        FastAPI --> AgentEngine
        FastAPI --> Ingest
    end

    subgraph Storage [Data Lake & DB Layer]
        S3[S3 / Local Lake: Parquet NAVs]
        Timescale[TimescaleDB PostgreSQL]
        Redis[Redis Cache]
        
        Ingest -->|Daily Upload| S3
        Ingest -->|Sync Recent NAVs| Timescale
        AgentEngine -->|Read Historical Data| S3
        FastAPI -->|Query Live Metrics| Timescale
        FastAPI -->|Read/Write Session Cache| Redis
    end

    NextJS -->|Proxy API Requests| FastAPI
```

---

## Key Features

1. **Sideways Market Detection (Numerical Engine)**
   * Parses 20+ years of daily Net Asset Value (NAV) records.
   * Runs a sliding window algorithm over index proxy series to locate periods holding a $\pm3\%$ price envelope for $\ge90$ days with no sustained breakouts.
2. **Hybrid Storage Architecture**
   * **S3 Parquet Lake**: Deep historical daily NAV records are kept in compressed columnar `.parquet` files per scheme code. This provides massive storage savings and enables fast range scans.
   * **TimescaleDB**: Current active sideways windows and the latest 1-2 years of NAV records are synced to a relational Postgres database for high-velocity index-correlation queries.
3. **Dual-Agent Compliance Pipeline (Google Gemini)**
   * **Quantitative Synthesis Agent (Gemini 1.5 Pro)**: Runs ReAct loops utilizing built-in mathematical skills (`list_categories`, `detect_sideways_windows`, `analyse_category_performance`) to compose dynamic, data-rich performance reports.
   * **SEBI Compliance Guardrail Agent (Gemini 1.5 Flash)**: Acts as a strict validator scan that sanitizes the final text output to remove any advisory recommendations (e.g. "buy/sell calls"), guaranteeing non-advisory description.

---

## Directory Structure

```
├── .github/workflows/         # CI/CD pipelines (DevOps showcase)
├── frontend-node/             # Node.js / Next.js Web App UI
├── backend-fastapi/           # Core API & Agentic Engine (Python)
│   ├── app/
│   │   ├── api/               # API Router & Calculations
│   │   ├── database/          # SQLAlchemy connection & schemas
│   │   ├── data_lake/         # S3 & Parquet handlers + AMFI Scraper
│   │   └── agents/            # ReAct Agent loop, roles, and skills
│   │       ├── roles/         # Prompt templates (Analyst, Compliance)
│   │       ├── skills/        # Registered agent tools
│   │       └── engine.py      # LLM connection & ReAct runner
│   └── main.py
├── infrastructure/            # Docker Compose & local config setups
└── README.md                  # Main developer documentation
```

---

## Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+
* Docker & Docker Compose (optional for local database container)

### 1. Provision Infrastructure
To run local database and cache services:
```bash
npm run docker:up
```

### 2. Configure Environment
Create a `.env` file under `/backend-fastapi`:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fundlens"
# Optionally add AWS credentials to connect to a remote S3 bucket
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

### 3. Spin Up Backend
Install dependencies and launch FastAPI:
```bash
cd backend-fastapi
pip install -r requirements.txt
python main.py
```
FastAPI docs will be available at `http://localhost:8000/docs`.

### 4. Spin Up Frontend
Install dependencies and launch Next.js:
```bash
cd ../frontend-node
npm install
npm run dev
```
Navigate to `http://localhost:3000` to interact with the application.
