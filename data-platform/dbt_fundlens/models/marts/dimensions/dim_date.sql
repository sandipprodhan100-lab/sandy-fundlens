{{
    config(
        materialized='table',
        schema='gold_marts',
        tags=['dimensions', 'gold']
    )
}}

with date_range as (
    -- Generates financial calendar dates from 2018-01-01 to 2030-12-31
    select dateadd(day, seq4(), '2018-01-01'::date) as calendar_date
    from table(generator(rowcount => 4749)) -- 13 years of daily dates
)

select
    to_number(to_varchar(calendar_date, 'YYYYMMDD')) as date_key,
    calendar_date,
    extract(year from calendar_date) as calendar_year,
    extract(quarter from calendar_date) as calendar_quarter,
    extract(month from calendar_date) as calendar_month,
    to_varchar(calendar_date, 'MMMM') as month_name,
    extract(day from calendar_date) as day_of_month,
    extract(dayofweek from calendar_date) as day_of_week,
    to_varchar(calendar_date, 'DY') as day_name,
    case when extract(dayofweek from calendar_date) in (0, 6) then false else true end as is_trading_day,
    -- Indian Fiscal Year (April 1 - March 31)
    case
        when extract(month from calendar_date) >= 4
        then 'FY' || to_varchar(extract(year from calendar_date)) || '-' || to_varchar(extract(year from calendar_date) + 1)
        else 'FY' || to_varchar(extract(year from calendar_date) - 1) || '-' || to_varchar(extract(year from calendar_date))
    end as fiscal_year,
    current_timestamp() as dbt_updated_at
from date_range
