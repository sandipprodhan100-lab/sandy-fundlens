{{
    config(
        materialized='table',
        schema='gold_marts',
        tags=['dimensions', 'gold']
    )
}}

with source_schemes as (
    select * from {{ ref('stg_amfi_schemes') }}
)

select
    -- Surrogate Key using dbt_utils or md5
    md5(cast(scheme_code as varchar)) as fund_key,
    scheme_code,
    scheme_name,
    amc_name,
    fund_category,
    plan_type,
    option_type,
    isin_div_payout,
    isin_div_reinvest,
    latest_nav_date,
    current_timestamp() as dbt_updated_at
from source_schemes
