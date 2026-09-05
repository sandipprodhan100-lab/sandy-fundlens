# FundLens Enterprise Data Platform

This folder contains the enterprise data engineering, lakehouse architecture, and transformation pipeline for **FundLens**.

## Directory Structure

```text
data-platform/
├── architecture/
│   ├── ARCHITECTURE.md          # End-to-end Medallion Lakehouse blueprint & Mermaid data lineage
│   └── PREREQUISITES.md         # AWS S3, Snowflake, and dbt setup instructions
│
├── airflow/                               # Apache Airflow Orchestration
│   ├── dags/
│   │   ├── fundlens_daily_elt_pipeline.py # End-to-end scheduled DAG
│   │   └── cosmos_fundlens_dag.py         # Astronomer Cosmos granular dbt DAG
│   ├── docker-compose.airflow.yml         # Containerized Airflow Cluster
│   ├── .env.airflow.example
│   └── README.md                          # Airflow setup & connection guide
│
├── snowflake/
│   ├── 01_setup_database_warehouse.sql    # Database, Warehouse, and Role DDL
│   ├── 02_storage_integration_s3.sql      # Secure cross-account S3 Storage Integration
│   └── 03_external_stage_and_snowpipe.sql # Parquet File Format, S3 Stage & Snowpipe Auto-Ingest
│
└── dbt_fundlens/                          # Production dbt Transformation Project
    ├── dbt_project.yml                    # dbt project definition & model layering
    ├── profiles.yml.example               # Snowflake connection profile template
    ├── packages.yml                       # dbt package dependencies
    ├── macros/                            # Custom SQL macros
    └── models/
        ├── staging/                       # Silver Layer: Cleaned, validated views
        │   ├── sources.yml
        │   ├── stg_amfi_nav_daily.sql
        │   ├── stg_amfi_schemes.sql
        │   └── schema.yml
        └── marts/                         # Gold Layer: Star Schema
            ├── dimensions/
            │   ├── dim_fund.sql
            │   ├── dim_amc.sql
            │   ├── dim_benchmark.sql
            │   └── dim_date.sql
            ├── facts/
            │   ├── fact_daily_nav.sql     # Incremental merge model
            │   └── fact_rolling_performance.sql
            └── schema.yml                 # Referential integrity & data quality tests
```

## Quick Start & Snowflake Connection Setup

Follow these steps to obtain your Snowflake details and configure dbt.

---

### Step 1: Discover Your Snowflake Account Details
Log in to your **Snowflake Web UI** and run the following SQL query in a worksheet:

```sql
-- 1. Get your exact Snowflake Account Identifier:
SELECT CURRENT_ORGANIZATION_NAME() || '-' || CURRENT_ACCOUNT_NAME() AS ACCOUNT_IDENTIFIER;
-- Output example: "MYORG-MYACCOUNT" or check URL: "xy12345.ap-south-1"

-- 2. Verify current user & active role:
SELECT CURRENT_USER(), CURRENT_ROLE();
```

---

### Step 2: Create a Dedicated Transformer User in Snowflake (Optional but Recommended)
Run in Snowflake as `SECURITYADMIN` / `ACCOUNTADMIN`:

```sql
USE ROLE SECURITYADMIN;

-- Create dedicated dbt developer user
CREATE USER IF NOT EXISTS FUNDLENS_DEV_USER
  PASSWORD = 'YourStrongPassword123!'
  DEFAULT_ROLE = FUNDLENS_TRANSFORMER_ROLE
  DEFAULT_WAREHOUSE = FUNDLENS_WH
  MUST_CHANGE_PASSWORD = FALSE
  COMMENT = 'dbt Developer Service User for FundLens';

-- Grant transformer role
GRANT ROLE FUNDLENS_TRANSFORMER_ROLE TO USER FUNDLENS_DEV_USER;
```

---

### Step 3: Run Database & S3 Storage Setup Scripts
Execute the SQL scripts in [`data-platform/snowflake/`](snowflake/) in numerical order:
1. `01_setup_database_warehouse.sql` &rarr; Creates `FUNDLENS_DW` database, schemas, and warehouse.
2. `02_storage_integration_s3.sql` &rarr; Configures secure S3 access.
3. `03_external_stage_and_snowpipe.sql` &rarr; Configures Parquet stage & Snowpipe auto-ingest.

---

### Step 4: Where to Configure Your dbt Credentials

You have **two easy methods** to configure your credentials:

#### Option A: Global User Profile File (`~/.dbt/profiles.yml`) — Recommended
dbt looks for `profiles.yml` in your home directory by default:
- **Windows**: `C:\Users\<YourUsername>\.dbt\profiles.yml`
- **macOS / Linux**: `~/.dbt/profiles.yml`

Create or edit that file with your values:

```yaml
dbt_fundlens:
  target: dev
  outputs:
    dev:
      type: snowflake
      account: <ACCOUNT_IDENTIFIER>  # e.g. "MYORG-MYACCOUNT" or "xy12345.ap-south-1"
      user: FUNDLENS_DEV_USER        # Or your Snowflake username
      password: "YourStrongPassword123!"
      role: FUNDLENS_TRANSFORMER_ROLE
      database: FUNDLENS_DW
      warehouse: FUNDLENS_WH
      schema: SILVER
      threads: 4
      client_session_keep_alive: False
```

#### Option B: Environment Variables (`.env`)
In `data-platform/dbt_fundlens/`, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USER`, `SNOWFLAKE_PASSWORD`.

---

### Step 5: Test Connection & Run Transformations

```bash
cd data-platform/dbt_fundlens

# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # (Windows PowerShell)
# source venv/bin/activate     # (macOS/Linux)

# 2. Install dbt-snowflake
pip install dbt-snowflake

# 3. Test Snowflake connection
dbt debug

# 4. Install dbt packages (dbt_utils)
dbt deps

# 5. Build all staging views and star-schema dimensional marts
dbt run

# 6. Run automated schema & referential integrity tests
dbt test
```

---

### Step 6: Query Analytics in Snowflake
Once `dbt run` completes, run any of the production queries in [`snowflake/04_analytics_queries_examples.sql`](snowflake/04_analytics_queries_examples.sql) to explore top funds, rolling alpha/beta, and category benchmarks!
