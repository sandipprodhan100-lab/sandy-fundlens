-- ==============================================================================
-- FundLens Enterprise Data Platform
-- Script 03: File Format, External Stage & Continuous Snowpipe Ingestion
-- ==============================================================================

USE ROLE SYSADMIN;
USE DATABASE FUNDLENS_DW;
USE SCHEMA RAW_STG;
USE WAREHOUSE FUNDLENS_WH;

-- 1. Create Parquet File Format
CREATE OR REPLACE FILE FORMAT PARQUET_FORMAT
  TYPE = 'PARQUET'
  COMPRESSION = 'SNAPPY'
  BINARY_AS_TEXT = FALSE
  COMMENT = 'Standard columnar Parquet format with Snappy compression for NAV datasets';

-- 2. Create External Stage referencing S3 Storage Integration
CREATE OR REPLACE STAGE S3_CURATED_STAGE
  STORAGE_INTEGRATION = s3_fundlens_curated_int
  URL = 's3://mutualfundlens-s3/curated/'
  FILE_FORMAT = PARQUET_FORMAT
  COMMENT = 'Stage accessing curated S3 partition prefix';

-- 3. Test listing files from S3 stage
-- LIST @S3_CURATED_STAGE/nav/;

-- 4. Create Raw Landing Table for AMFI Daily NAV Data
CREATE OR REPLACE TABLE AMFI_NAV_STREAM (
  SCHEME_CODE         VARCHAR(50),
  SCHEME_NAME         VARCHAR(500),
  ISIN_DIV_PAYOUT     VARCHAR(50),
  ISIN_DIV_REINVEST   VARCHAR(50),
  NET_ASSET_VALUE     VARCHAR(50),   -- Kept raw string in bronze, cast to NUMBER(12,4) in Silver
  REPURCHASE_PRICE    VARCHAR(50),
  SALE_PRICE          VARCHAR(50),
  NAV_DATE            VARCHAR(50),   -- Kept raw string in bronze, cast to DATE in Silver
  INGESTION_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  SOURCE_FILE_NAME    VARCHAR(1000) DEFAULT METADATA$FILENAME,
  SOURCE_FILE_ROW_NUM NUMBER(18,0) DEFAULT METADATA$FILE_ROW_NUMBER
)
COMMENT = 'Bronze landing table for raw AMFI NAV feed streamed from S3';

-- 5. Create Snowpipe for Automated Ingestion
CREATE OR REPLACE PIPE PIPE_AMFI_NAV_INGEST
  AUTO_INGEST = TRUE
  COMMENT = 'Snowpipe continuously ingesting curated Parquet files from S3 into AMFI_NAV_STREAM'
AS
COPY INTO AMFI_NAV_STREAM (
  SCHEME_CODE,
  SCHEME_NAME,
  ISIN_DIV_PAYOUT,
  ISIN_DIV_REINVEST,
  NET_ASSET_VALUE,
  REPURCHASE_PRICE,
  SALE_PRICE,
  NAV_DATE
)
FROM (
  SELECT
    $1:scheme_code::VARCHAR,
    $1:scheme_name::VARCHAR,
    $1:isin_div_payout::VARCHAR,
    $1:isin_div_reinvest::VARCHAR,
    $1:net_asset_value::VARCHAR,
    $1:repurchase_price::VARCHAR,
    $1:sale_price::VARCHAR,
    $1:nav_date::VARCHAR
  FROM @S3_CURATED_STAGE/nav/
)
FILE_FORMAT = (FORMAT_NAME = 'PARQUET_FORMAT')
ON_ERROR = 'CONTINUE';

-- 6. Retrieve the SQS Queue ARN for S3 Bucket Event Notification
SHOW PIPES LIKE 'PIPE_AMFI_NAV_INGEST';

/*
   NOTE: In the SHOW PIPES output, find the `notification_channel` column.
   Copy this ARN (e.g. arn:aws:sqs:ap-south-1:123456789012:sf-snowpipe-...)
   and configure an S3 Bucket Event Notification on `s3://mutualfundlens-s3`
   under prefix `curated/nav/` for ObjectCreated events.
*/

SELECT 'File format, external stage, raw table, and Snowpipe configured successfully!' AS STATUS;
