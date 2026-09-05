{{
    config(
        materialized='table',
        schema='gold_marts',
        tags=['dimensions', 'gold']
    )
}}

with distinct_amcs as (
    select
        amc_name,
        count(distinct scheme_code) as total_schemes_managed,
        min(latest_nav_date) as oldest_nav_tracked,
        max(latest_nav_date) as latest_nav_tracked
    from {{ ref('stg_amfi_schemes') }}
    group by 1
)

select
    md5(cast(amc_name as varchar)) as amc_key,
    amc_name,
    total_schemes_managed,
    oldest_nav_tracked,
    latest_nav_tracked,
    current_timestamp() as dbt_updated_at
from distinct_amcs
