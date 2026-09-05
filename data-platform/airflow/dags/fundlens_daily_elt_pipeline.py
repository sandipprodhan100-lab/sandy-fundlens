"""
==============================================================================
FundLens Enterprise Data Platform
Airflow DAG: Daily AMFI Ingest, S3 Curated Check, Snowflake Snowpipe & dbt Pipeline
Schedule: Monday to Friday at 22:00 IST (16:30 UTC) post-market NAV publications
==============================================================================
"""

from datetime import datetime, timedelta
import os
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.snowflake.operators.snowflake import SnowflakeOperator
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor

# Pipeline Configuration
DBT_PROJECT_DIR = os.environ.get(
    "DBT_PROJECT_DIR", "/opt/airflow/dbt_fundlens"
)
DBT_PROFILES_DIR = os.environ.get(
    "DBT_PROFILES_DIR", "/opt/airflow/dbt_fundlens"
)
SNOWFLAKE_CONN_ID = "snowflake_fundlens"
AWS_CONN_ID = "aws_default"
S3_BUCKET = os.environ.get("AWS_S3_BUCKET", "mutualfundlens-s3")

# Default Task Arguments
default_args = {
    "owner": "fundlens-data-team",
    "depends_on_past": False,
    "email": ["alerts@sandipprodhan.in"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=3),
    "execution_timeout": timedelta(minutes=30),
}

# Define DAG
with DAG(
    dag_id="fundlens_daily_elt_pipeline",
    default_args=default_args,
    description="End-to-end Medallion ELT: S3 Curated check -> Snowpipe sync -> dbt Staging (Silver) -> dbt Star Schema (Gold)",
    # 22:00 IST (16:30 UTC), Monday through Friday
    schedule_interval="30 16 * * 1-5",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["fundlens", "dbt", "snowflake", "medallion", "production"],
) as dag:

    # 1. Pipeline Start
    start_pipeline = EmptyOperator(
        task_id="start_pipeline"
    )

    # 2. Check S3 Curated Parquet Landing
    check_s3_curated_landing = S3KeySensor(
        task_id="check_s3_curated_landing",
        bucket_name=S3_BUCKET,
        bucket_key="curated/nav/year={{ execution_date.strftime('%Y') }}/month={{ execution_date.strftime('%m') }}/*.parquet",
        wildcard_match=True,
        aws_conn_id=AWS_CONN_ID,
        timeout=1800,  # 30 mins
        poke_interval=60,
        mode="reschedule",
    )

    # 3. Verify Snowflake Raw Landing & Snowpipe Status
    verify_snowpipe_sync = SnowflakeOperator(
        task_id="verify_snowpipe_sync",
        snowflake_conn_id=SNOWFLAKE_CONN_ID,
        sql="""
            ALTER PIPE FUNDLENS_DW.RAW_STG.PIPE_AMFI_NAV_INGEST REFRESH;
            
            SELECT SYSTEM$PIPE_STATUS('FUNDLENS_DW.RAW_STG.PIPE_AMFI_NAV_INGEST');
            
            -- Verify recent records exist in Bronze stage
            SELECT COUNT(*) AS row_count
            FROM FUNDLENS_DW.RAW_STG.AMFI_NAV_STREAM
            WHERE INGESTION_TIMESTAMP >= DATEADD(day, -1, CURRENT_TIMESTAMP());
        """,
    )

    # 4. Install dbt Dependencies
    dbt_deps = BashOperator(
        task_id="dbt_deps",
        bash_command=f"cd {DBT_PROJECT_DIR} && dbt deps --profiles-dir {DBT_PROFILES_DIR}",
    )

    # 5. dbt Run Silver Staging Models
    dbt_run_staging = BashOperator(
        task_id="dbt_run_staging",
        bash_command=f"cd {DBT_PROJECT_DIR} && dbt run --select staging --profiles-dir {DBT_PROFILES_DIR} --target prod",
    )

    # 6. dbt Test Silver Staging Models (Data Contracts)
    dbt_test_staging = BashOperator(
        task_id="dbt_test_staging",
        bash_command=f"cd {DBT_PROJECT_DIR} && dbt test --select staging --profiles-dir {DBT_PROFILES_DIR} --target prod",
    )

    # 7. dbt Run Gold Dimensional Marts & Incremental Facts
    dbt_run_marts = BashOperator(
        task_id="dbt_run_marts",
        bash_command=f"cd {DBT_PROJECT_DIR} && dbt run --select marts --profiles-dir {DBT_PROFILES_DIR} --target prod",
    )

    # 8. dbt Test Gold Marts (Referential Integrity & Uniqueness)
    dbt_test_marts = BashOperator(
        task_id="dbt_test_marts",
        bash_command=f"cd {DBT_PROJECT_DIR} && dbt test --select marts --profiles-dir {DBT_PROFILES_DIR} --target prod",
    )

    # 9. Pipeline Completed Hook
    pipeline_completed = EmptyOperator(
        task_id="pipeline_completed"
    )

    # -------------------------------------------------------------------------
    # DAG Task Dependencies (Linear & Robust)
    # -------------------------------------------------------------------------
    (
        start_pipeline
        >> check_s3_curated_landing
        >> verify_snowpipe_sync
        >> dbt_deps
        >> dbt_run_staging
        >> dbt_test_staging
        >> dbt_run_marts
        >> dbt_test_marts
        >> pipeline_completed
    )
