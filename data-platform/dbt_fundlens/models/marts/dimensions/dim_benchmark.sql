{{
    config(
        materialized='table',
        schema='gold_marts',
        tags=['dimensions', 'gold']
    )
}}

with benchmark_definitions as (
    select 'nifty50' as benchmark_id, 'NIFTY 50' as benchmark_name, 'Large Cap' as primary_category, 'National Stock Exchange' as exchange union all
    select 'midcap150', 'NIFTY Midcap 150', 'Mid Cap', 'National Stock Exchange' union all
    select 'smallcap250', 'NIFTY Smallcap 250', 'Small Cap', 'National Stock Exchange' union all
    select 'nifty500', 'NIFTY 500', 'Flexi / Multi Cap', 'National Stock Exchange'
)

select
    md5(cast(benchmark_id as varchar)) as benchmark_key,
    benchmark_id,
    benchmark_name,
    primary_category,
    exchange,
    current_timestamp() as dbt_updated_at
from benchmark_definitions
