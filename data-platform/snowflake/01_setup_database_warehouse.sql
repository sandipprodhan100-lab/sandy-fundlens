-- ==============================================================================
-- FundLens Enterprise Data Platform
-- Script 01: Setup Database, Schemas, Roles & Virtual Warehouse
-- ==============================================================================

-- 1. Use ACCOUNTADMIN or SYSADMIN
USE ROLE SYSADMIN;

-- 2. Create Dedicated Virtual Warehouse with Cost Governance
CREATE WAREHOUSE IF NOT EXISTS FUNDLENS_WH
  WITH
  WAREHOUSE_SIZE = 'X-SMALL'
  AUTO_SUSPEND = 60          -- Suspend after 60 seconds of inactivity (Cost optimization)
  AUTO_RESUME = TRUE         -- Auto-resume upon incoming query or dbt job
  INITIALLY_SUSPENDED = TRUE
  COMMENT = 'Dedicated compute warehouse for FundLens transformation and analytics';

-- 3. Create Enterprise Database
CREATE DATABASE IF NOT EXISTS FUNDLENS_DW
  COMMENT = 'FundLens Central Analytical Data Warehouse';

USE DATABASE FUNDLENS_DW;

-- 4. Create Medallion Schemas
-- Bronze: Raw streaming & micro-batch landing
CREATE SCHEMA IF NOT EXISTS RAW_STG
  COMMENT = 'Bronze Layer: Raw unmodeled S3 data loaded via Snowpipe';

-- Silver: Cleaned, type-casted staging models (managed by dbt)
CREATE SCHEMA IF NOT EXISTS SILVER
  COMMENT = 'Silver Layer: Cleaned, validated views and intermediate entities';

-- Gold: Conformed Star Schema dimensional marts (managed by dbt)
CREATE SCHEMA IF NOT EXISTS GOLD_MARTS
  COMMENT = 'Gold Layer: Star Schema Dimensions and Incremental Fact Tables';

-- 5. Role & Permission Governance
USE ROLE SECURITYADMIN;

CREATE ROLE IF NOT EXISTS FUNDLENS_TRANSFORMER_ROLE
  COMMENT = 'Role utilized by dbt CI/CD service accounts';

-- Grant warehouse privileges
GRANT USAGE, OPERATE ON WAREHOUSE FUNDLENS_WH TO ROLE FUNDLENS_TRANSFORMER_ROLE;

-- Grant database privileges
GRANT USAGE ON DATABASE FUNDLENS_DW TO ROLE FUNDLENS_TRANSFORMER_ROLE;

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA FUNDLENS_DW.RAW_STG TO ROLE FUNDLENS_TRANSFORMER_ROLE;
GRANT ALL PRIVILEGES ON SCHEMA FUNDLENS_DW.SILVER TO ROLE FUNDLENS_TRANSFORMER_ROLE;
GRANT ALL PRIVILEGES ON SCHEMA FUNDLENS_DW.GOLD_MARTS TO ROLE FUNDLENS_TRANSFORMER_ROLE;

-- Grant to SYSADMIN for hierarchy maintenance
GRANT ROLE FUNDLENS_TRANSFORMER_ROLE TO ROLE SYSADMIN;

SELECT 'Database, Warehouse, and Schemas successfully created for FundLens!' AS STATUS;
