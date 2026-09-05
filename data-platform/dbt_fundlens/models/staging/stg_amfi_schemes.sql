{{
    config(
        materialized='view',
        tags=['staging', 'metadata']
    )
}}

with distinct_schemes as (
    select
        scheme_code,
        scheme_name,
        isin_div_payout,
        isin_div_reinvest,
        max(nav_date) as latest_nav_date
    from {{ ref('stg_amfi_nav_daily') }}
    group by 1, 2, 3, 4
),

parsed as (
    select
        scheme_code,
        scheme_name,
        isin_div_payout,
        isin_div_reinvest,
        latest_nav_date,

        -- AMC Extraction Logic
        case
            when upper(scheme_name) like '%HDFC%' then 'HDFC Mutual Fund'
            when upper(scheme_name) like '%ICICI PRUDENTIAL%' or upper(scheme_name) like '%ICICI PRU%' then 'ICICI Prudential Mutual Fund'
            when upper(scheme_name) like '%SBI%' then 'SBI Mutual Fund'
            when upper(scheme_name) like '%NIPPON%' then 'Nippon India Mutual Fund'
            when upper(scheme_name) like '%KOTAK%' then 'Kotak Mahindra Mutual Fund'
            when upper(scheme_name) like '%AXIS%' then 'Axis Mutual Fund'
            when upper(scheme_name) like '%UTI%' then 'UTI Mutual Fund'
            when upper(scheme_name) like '%MIRAE%' then 'Mirae Asset Mutual Fund'
            when upper(scheme_name) like '%PARAG PARIKH%' or upper(scheme_name) like '%PPFAS%' then 'Parag Parikh Mutual Fund'
            when upper(scheme_name) like '%BANDHAN%' then 'Bandhan Mutual Fund'
            when upper(scheme_name) like '%TATA%' then 'Tata Mutual Fund'
            when upper(scheme_name) like '%MOTILAL OSWAL%' then 'Motilal Oswal Mutual Fund'
            when upper(scheme_name) like '%EDELWEISS%' then 'Edelweiss Mutual Fund'
            when upper(scheme_name) like '%QUANT%' then 'Quant Mutual Fund'
            else 'Other AMC'
        end as amc_name,

        -- Category Classification
        case
            when upper(scheme_name) like '%LARGE CAP%' or upper(scheme_name) like '%BLUECHIP%' or upper(scheme_name) like '%TOP 100%' then 'Large Cap'
            when upper(scheme_name) like '%MID CAP%' or upper(scheme_name) like '%MIDCAP%' or upper(scheme_name) like '%EMERGING%' then 'Mid Cap'
            when upper(scheme_name) like '%SMALL CAP%' or upper(scheme_name) like '%SMALLCAP%' then 'Small Cap'
            when upper(scheme_name) like '%FLEXI CAP%' or upper(scheme_name) like '%FLEXICAP%' then 'Flexi Cap'
            when upper(scheme_name) like '%MULTI CAP%' or upper(scheme_name) like '%MULTICAP%' then 'Multi Cap'
            when upper(scheme_name) like '%HYBRID%' or upper(scheme_name) like '%BALANCED ADVANTAGE%' or upper(scheme_name) like '%AGGRESSIVE%' then 'Hybrid'
            else 'Other Category'
        end as fund_category,

        -- Plan Type (Direct vs Regular)
        case
            when upper(scheme_name) like '%DIRECT%' then 'Direct'
            else 'Regular'
        end as plan_type,

        -- Option (Growth vs IDCW)
        case
            when upper(scheme_name) like '%GROWTH%' then 'Growth'
            when upper(scheme_name) like '%IDCW%' or upper(scheme_name) like '%DIVIDEND%' then 'IDCW'
            else 'Other'
        end as option_type

    from distinct_schemes
)

select
    scheme_code,
    scheme_name,
    amc_name,
    fund_category,
    plan_type,
    option_type,
    isin_div_payout,
    isin_div_reinvest,
    latest_nav_date
from parsed
