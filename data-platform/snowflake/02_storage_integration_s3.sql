-- ==============================================================================
-- FundLens Enterprise Data Platform
-- Script 02: AWS S3 Storage Integration (Zero Static Key Architecture)
-- ==============================================================================

USE ROLE ACCOUNTADMIN;
USE DATABASE FUNDLENS_DW;

-- 1. Create External S3 Storage Integration
-- Replace <AWS_ACCOUNT_ID> with your AWS Account ID
CREATE OR REPLACE STORAGE INTEGRATION s3_fundlens_curated_int
  TYPE = EXTERNAL_STAGE
  STORAGE_PROVIDER = 'S3'
  ENABLED = TRUE
  STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::<AWS_ACCOUNT_ID>:role/FundLensSnowflakeS3Role'
  STORAGE_ALLOWED_LOCATIONS = ('s3://mutualfundlens-s3/curated/')
  COMMENT = 'Storage integration for FundLens curated S3 bucket';

-- 2. Retrieve the Snowflake AWS IAM User ARN and External ID
-- Run this command to inspect the generated Snowflake IAM identities:
DESC INTEGRATION s3_fundlens_curated_int;

/*
   IMPORTANT STEP:
   After running DESC INTEGRATION, retrieve:
   - STORAGE_AWS_IAM_USER_ARN
   - STORAGE_AWS_EXTERNAL_ID

   Update your AWS IAM Role (FundLensSnowflakeS3Role) Trust Relationship policy with these values.
   See PREREQUISITES.md Section 3.4 for full instructions.
*/

-- 3. Grant usage to the dbt Transformer role
GRANT USAGE ON INTEGRATION s3_fundlens_curated_int TO ROLE FUNDLENS_TRANSFORMER_ROLE;

SELECT 'Storage Integration created. Execute DESC INTEGRATION to configure AWS IAM Role trust relationship.' AS NEXT_STEP;
