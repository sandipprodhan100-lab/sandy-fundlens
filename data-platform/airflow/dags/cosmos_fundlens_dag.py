"""
==============================================================================
FundLens Enterprise Data Platform
Astronomer Cosmos DAG: Granular dbt Model Execution in Snowflake
Renders each dbt model (stg_, dim_, fct_) as an independent Airflow task
==============================================================================
"""

import os
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.empty import EmptyOperator

# If astronomer-cosmos is installed, use DbtTaskGroup
try:
    from cosmos import DbtTaskGroup, ProjectConfig, ProfileConfig, ExecutionConfig
    from cosmos.profiles import SnowflakeUserPasswordProfileMapping
    COSMOS_AVAILABLE = True
except ImportError:
    COSMOS_AVAILABLE = False

DBT_PROJECT_DIR = os.environ.get("DBT_PROJECT_DIR", "/opt/airflow/dbt_fundlens")

default_args = {
    "owner": "fundlens-data-team",
    "retries": 2,
    "retry_delay": timedelta(minutes=3),
}

with DAG(
    dag_id="fundlens_cosmos_dbt_snowflake",
    default_args=default_args,
    description="Astronomer Cosmos DAG rendering individual dbt models as Airflow task nodes",
    schedule_interval="30 16 * * 1-5", # 22:00 IST weekdays
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["fundlens", "cosmos", "dbt", "snowflake"],
) as dag:

    start = EmptyOperator(task_id="start")
    end = EmptyOperator(task_id="end")

    if COSMOS_AVAILABLE:
        profile_config = ProfileConfig(
            profile_name="dbt_fundlens",
            target_name="prod",
            profile_mapping=SnowflakeUserPasswordProfileMapping(
                conn_id="snowflake_fundlens",
                profile_args={"database": "FUNDLENS_DW", "schema": "SILVER"},
            ),
        )

        dbt_tg = DbtTaskGroup(
            group_id="dbt_fundlens_transformations",
            project_config=ProjectConfig(DBT_PROJECT_DIR),
            profile_config=profile_config,
            execution_config=ExecutionConfig(dbt_executable_path="dbt"),
        )

        start >> dbt_tg >> end
    else:
        # Fallback placeholder when cosmos is not installed locally
        placeholder = EmptyOperator(
            task_id="cosmos_requires_astronomer_cosmos_package"
        )
        start >> placeholder >> end
