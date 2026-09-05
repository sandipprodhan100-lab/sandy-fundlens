{{
    config(
        materialized='incremental',
        unique_key=['scheme_code', 'nav_date'],
        incremental_strategy='merge',
        cluster_by=['nav_date', 'scheme_code'],
        schema='gold_marts',
        tags=['facts', 'gold', 'daily']
    )
}}

with source_stg as (
    select * from {{ ref('stg_amfi_nav_daily') }}
    {% if is_incremental() %}
        -- In incremental runs, only process partition dates from the last 7 days to merge updates/corrections
        where nav_date >= dateadd(day, -7, (select max(nav_date) from {{ this }}))
    {% endif %}
),

funds as (
    select scheme_code, fund_key from {{ ref('dim_fund') }}
),

with_metrics as (
    select
        s.scheme_code,
        f.fund_key,
        to_number(to_varchar(s.nav_date, 'YYYYMMDD')) as date_key,
        s.nav_date,
        s.net_asset_value,
        s.repurchase_price,
        s.sale_price,

        -- Daily Return calculation using window function
        lag(s.net_asset_value) over (
            partition by s.scheme_code
            order by s.nav_date asc
        ) as prev_day_nav,

        case
            when lag(s.net_asset_value) over (partition by s.scheme_code order by s.nav_date asc) > 0
            then (s.net_asset_value - lag(s.net_asset_value) over (partition by s.scheme_code order by s.nav_date asc))
                 / lag(s.net_asset_value) over (partition by s.scheme_code order by s.nav_date asc)
            else null
        end as daily_return_pct,

        s.ingestion_timestamp,
        current_timestamp() as dbt_updated_at

    from source_stg s
    left join funds f on s.scheme_code = f.scheme_code
)

select * from with_metrics
