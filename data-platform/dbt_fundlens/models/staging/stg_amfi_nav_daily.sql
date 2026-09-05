{{
    config(
        materialized='view',
        tags=['staging', 'daily']
    )
}}

with source_data as (
    select * from {{ source('raw_stg', 'amfi_nav_stream') }}
),

cleaned as (
    select
        -- Identifiers
        trim(scheme_code)::varchar(50) as scheme_code,
        trim(scheme_name)::varchar(500) as scheme_name,
        nullif(trim(isin_div_payout), '-')::varchar(50) as isin_div_payout,
        nullif(trim(isin_div_reinvest), '-')::varchar(50) as isin_div_reinvest,

        -- Numerical Metrics
        try_to_number(trim(net_asset_value), 12, 4) as net_asset_value,
        try_to_number(nullif(trim(repurchase_price), '-'), 12, 4) as repurchase_price,
        try_to_number(nullif(trim(sale_price), '-'), 12, 4) as sale_price,

        -- Date & Timestamp parsing
        try_to_date(trim(nav_date), 'YYYY-MM-DD') as nav_date,
        ingestion_timestamp,
        source_file_name,
        source_file_row_num,

        -- Deduplication window: keep latest record per (scheme_code, nav_date)
        row_number() over (
            partition by trim(scheme_code), try_to_date(trim(nav_date), 'YYYY-MM-DD')
            order by ingestion_timestamp desc, source_file_row_num desc
        ) as row_num

    from source_data
    where
        scheme_code is not null
        and nav_date is not null
        and net_asset_value is not null
        and try_to_number(trim(net_asset_value), 12, 4) is not null
        and try_to_number(trim(net_asset_value), 12, 4) > 0
)

select
    scheme_code,
    scheme_name,
    isin_div_payout,
    isin_div_reinvest,
    net_asset_value,
    repurchase_price,
    sale_price,
    nav_date,
    ingestion_timestamp,
    source_file_name
from cleaned
where row_num = 1
