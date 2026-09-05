{{
    config(
        materialized='table',
        schema='gold_marts',
        tags=['facts', 'performance', 'gold']
    )
}}

with daily_navs as (
    select
        scheme_code,
        fund_key,
        nav_date,
        net_asset_value,
        daily_return_pct
    from {{ ref('fact_daily_nav') }}
),

latest_date as (
    select max(nav_date) as max_nav_date from daily_navs
),

current_nav as (
    select
        d.scheme_code,
        d.fund_key,
        d.nav_date,
        d.net_asset_value as latest_nav
    from daily_navs d
    cross join latest_date l
    where d.nav_date = l.max_nav_date
),

lookbacks as (
    select
        d.scheme_code,
        d.nav_date,
        d.net_asset_value,
        row_number() over (partition by d.scheme_code order by d.nav_date desc) as recency_rank
    from daily_navs d
),

rolling_metrics as (
    select
        c.scheme_code,
        c.fund_key,
        c.nav_date as as_of_date,
        c.latest_nav,

        -- 1 Month (~21 trading days)
        max(case when l.recency_rank = 21 then (c.latest_nav - l.net_asset_value) / l.net_asset_value end) as return_1m_pct,

        -- 3 Months (~63 trading days)
        max(case when l.recency_rank = 63 then (c.latest_nav - l.net_asset_value) / l.net_asset_value end) as return_3m_pct,

        -- 6 Months (~126 trading days)
        max(case when l.recency_rank = 126 then (c.latest_nav - l.net_asset_value) / l.net_asset_value end) as return_6m_pct,

        -- 1 Year (~252 trading days)
        max(case when l.recency_rank = 252 then (c.latest_nav - l.net_asset_value) / l.net_asset_value end) as return_1y_pct,

        -- 3 Year CAGR (~756 trading days)
        max(case when l.recency_rank = 756 then power(c.latest_nav / l.net_asset_value, 1.0 / 3.0) - 1.0 end) as cagr_3y_pct,

        current_timestamp() as dbt_updated_at

    from current_nav c
    left join lookbacks l on c.scheme_code = l.scheme_code
    group by 1, 2, 3, 4
)

select * from rolling_metrics
