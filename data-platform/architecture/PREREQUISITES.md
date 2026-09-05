# Prerequisites & Setup Guide: S3, Snowflake, and dbt

This document provides a step-by-step implementation guide to configure the infrastructure required to run the FundLens Enterprise Data Platform.

---

## 1. Cloud & Tool Prerequisites Overview

| Component | Prerequisite Requirement |
|---|---|
| **AWS Account** | Access to create S3 bucket prefixes, IAM Roles, and S3 Event Notifications |
| **Snowflake Account** | `ACCOUNTADMIN` or `SYSADMIN` role to configure Storage Integration & Stages |
| **Python Environment** | Python 3.10+ with `dbt-snowflake` & `virtualenv` |
| **GitHub Repository** | GitHub Secrets for automated CI/CD pipeline triggers |

---

## 2. AWS Infrastructure Setup

### Step 2.1: S3 Curated Prefix Hierarchy
Ensure the S3 bucket (`mutualfundlens-s3`) has the segregated directory structure:
```bash
# Curated / Silver Layer folders
aws s3api put-object --bucket mutualfundlens-s3 --key curated/nav/
aws s3api put-object --bucket mutualfundlens-s3 --key curated/scheme_metadata/
aws s3api put-object --bucket mutualfundlens-s3 --key curated/benchmarks/
```

### Step 2.2: IAM Policy for Snowflake Access
Create an IAM Policy named `FundLensSnowflakeS3AccessPolicy`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::mutualfundlens-s3/curated/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::mutualfundlens-s3",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["curated/*"]
        }
      }
    }
  ]
}
```

### Step 2.3: IAM Role Creation
Create an IAM Role `FundLensSnowflakeS3Role` with a temporary trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```
*(You will update the trust policy in Section 3 after Snowflake generates the storage integration ARN).*

---

## 3. Snowflake Setup & Storage Integration

### Step 3.1: Execute Snowflake Database & Warehouse Setup
Run the script in [01_setup_database_warehouse.sql](file:///c:/Users/sdpnb/projects/fundlens/data-platform/snowflake/01_setup_database_warehouse.sql).

### Step 3.2: Create Snowflake Storage Integration
Run [02_storage_integration_s3.sql](file:///c:/Users/sdpnb/projects/fundlens/data-platform/snowflake/02_storage_integration_s3.sql):
```sql
CREATE OR REPLACE STORAGE INTEGRATION s3_fundlens_curated_int
  TYPE = EXTERNAL_STAGE
  STORAGE_PROVIDER = 'S3'
  ENABLED = TRUE
  STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::<YOUR_AWS_ACCOUNT_ID>:role/FundLensSnowflakeS3Role'
  STORAGE_ALLOWED_LOCATIONS = ('s3://mutualfundlens-s3/curated/');
```

### Step 3.3: Retrieve Snowflake IAM User & External ID
Execute:
```sql
DESC INTEGRATION s3_fundlens_curated_int;
```
Note the two values:
- `STORAGE_AWS_IAM_USER_ARN` (e.g. `arn:aws:iam::123456789012:user/abc1-b-selfservice`)
- `STORAGE_AWS_EXTERNAL_ID` (e.g. `ABC12345_SFCRole=2_...`)

### Step 3.4: Update AWS IAM Role Trust Policy
Update the Trust Relationship on `FundLensSnowflakeS3Role` in AWS IAM:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "<STORAGE_AWS_IAM_USER_ARN>"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "<STORAGE_AWS_EXTERNAL_ID>"
        }
      }
    }
  ]
}
```

### Step 3.5: Execute External Stage & Snowpipe Setup
Run [03_external_stage_and_snowpipe.sql](file:///c:/Users/sdpnb/projects/fundlens/data-platform/snowflake/03_external_stage_and_snowpipe.sql) to provision:
- Parquet File Format
- `@S3_CURATED_STAGE`
- `RAW_STG.AMFI_NAV_STREAM`
- `PIPE_AMFI_NAV_INGEST`

---

## 4. Local dbt Environment Setup

### Step 4.1: Install Python Virtual Environment & dbt
```bash
cd data-platform/dbt_fundlens

# Create virtualenv
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# Or macOS/Linux:
# source venv/bin/activate

# Install dbt for Snowflake
pip install --upgrade pip
pip install dbt-snowflake
```

### Step 4.2: Configure `profiles.yml`
Copy `profiles.yml.example` to `~/.dbt/profiles.yml`:
```bash
# Windows
mkdir -p "$HOME\.dbt"
cp profiles.yml.example "$HOME\.dbt\profiles.yml"
```
Populate your Snowflake account identifier, user, warehouse, and authentication method.

### Step 4.3: Validate dbt Connection
```bash
dbt debug
```
A successful connection will show:
```text
Connection test: [OK connection ok]
All checks passed!
```

### Step 4.4: Install Packages & Run Models
```bash
# Install dependencies (dbt_utils)
dbt deps

# Run models (Staging -> Dimensions -> Facts)
dbt run

# Run automated tests
dbt test
```
