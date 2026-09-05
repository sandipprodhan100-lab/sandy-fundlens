# FundLens Enterprise Data Platform

This folder contains the enterprise data engineering, lakehouse architecture, and transformation pipeline for **FundLens**.

## Directory Structure

```text
data-platform/
├── architecture/
│   ├── ARCHITECTURE.md          # End-to-end Medallion Lakehouse blueprint & Mermaid data lineage
│   └── PREREQUISITES.md         # AWS S3, Snowflake, and dbt setup instructions
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

## Quick Start

1. Review the [Architecture Blueprint](architecture/ARCHITECTURE.md).
2. Follow the [Prerequisites Checklist](architecture/PREREQUISITES.md) to configure AWS and Snowflake.
3. Apply the SQL scripts in `snowflake/` in numerical order (`01` &rarr; `02` &rarr; `03`).
4. Set up your local dbt environment in `dbt_fundlens/`:
   ```bash
   cd data-platform/dbt_fundlens
   python -m venv venv
   source venv/bin/activate  # Or .\venv\Scripts\Activate.ps1 on Windows
   pip install dbt-snowflake
   dbt deps
   dbt run
   dbt test
   ```
