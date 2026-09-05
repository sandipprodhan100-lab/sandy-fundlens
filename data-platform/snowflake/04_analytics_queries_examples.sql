-- ==============================================================================
-- FundLens Enterprise Data Platform
-- Script 04: Production Analytics Queries & Star Schema Usage Examples
-- Database: FUNDLENS_DW | Schema: GOLD_MARTS | Warehouse: FUNDLENS_WH
-- ==============================================================================

USE ROLE SYSADMIN;
USE DATABASE FUNDLENS_DW;
USE SCHEMA GOLD_MARTS;
USE WAREHOUSE FUNDLENS_WH;

-- ==============================================================================
-- 1. Top 5 Performing Funds per Category by 3-Year CAGR
-- ==============================================================================
WITH ranked_funds AS (
    SELECT
        f.fund_category,
        f.scheme_name,
        f.amc_name,
        f.plan_type,
        p.latest_nav,
        p.return_1y_pct * 100 AS return_1y_pct,
        p.cagr_3y_pct * 100 AS cagr_3y_pct,
        DENSE_RANK() OVER (
            PARTITION BY f.fund_category 
            ORDER BY p.cagr_3y_pct DESC NULLS LAST
        ) as category_rank
    FROM FACT_ROLLING_PERFORMANCE p
    JOIN DIM_FUND f ON p.scheme_code = f.scheme_code
    WHERE f.plan_type = 'Direct' -- Focus on Direct plans
      AND f.option_type = 'Growth'
)
SELECT
    fund_category,
    category_rank,
    scheme_name,
    amc_name,
    latest_nav,
    ROUND(return_1y_pct, 2) AS return_1y_pct,
    ROUND(cagr_3y_pct, 2) AS cagr_3y_pct
FROM ranked_funds
WHERE category_rank <= 5
ORDER BY fund_category, category_rank;


-- ==============================================================================
-- 2. AMC Market Share & Category Distribution Analytics
-- ==============================================================================
SELECT
    a.amc_name,
    COUNT(DISTINCT f.scheme_code) AS total_schemes_tracked,
    COUNT(DISTINCT CASE WHEN f.fund_category = 'Large Cap' THEN f.scheme_code END) AS large_cap_count,
    COUNT(DISTINCT CASE WHEN f.fund_category = 'Mid Cap' THEN f.scheme_code END) AS mid_cap_count,
    COUNT(DISTINCT CASE WHEN f.fund_category = 'Small Cap' THEN f.scheme_code END) AS small_cap_count,
    COUNT(DISTINCT CASE WHEN f.fund_category = 'Flexi Cap' THEN f.scheme_code END) AS flexi_cap_count,
    ROUND(AVG(p.return_1y_pct) * 100, 2) AS avg_amc_1y_return_pct
FROM DIM_AMC a
JOIN DIM_FUND f ON a.amc_name = f.amc_name
LEFT JOIN FACT_ROLLING_PERFORMANCE p ON f.scheme_code = p.scheme_code
GROUP BY a.amc_name
HAVING total_schemes_tracked > 5
ORDER BY total_schemes_tracked DESC;


-- ==============================================================================
-- 3. Time-Series Daily NAV & Volatility Scan using Calendar Dimension
-- ==============================================================================
SELECT
    d.calendar_date,
    d.fiscal_year,
    d.day_name,
    f.scheme_name,
    f.fund_category,
    nav.net_asset_value,
    ROUND(nav.daily_return_pct * 100, 4) AS daily_return_pct,
    -- 30-day Rolling Volatility (Annualized standard deviation)
    ROUND(
        STDDEV(nav.daily_return_pct) OVER (
            PARTITION BY nav.scheme_code 
            ORDER BY d.calendar_date 
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) * SQRT(252) * 100, 
        2
    ) AS rolling_30d_annualized_volatility_pct
FROM FACT_DAILY_NAV nav
JOIN DIM_DATE d ON nav.date_key = d.date_key
JOIN DIM_FUND f ON nav.scheme_code = f.scheme_code
WHERE f.scheme_code IN ('120503', '125354', '118989') -- Sample scheme codes
  AND d.calendar_date >= DATEADD(month, -6, CURRENT_DATE())
ORDER BY f.scheme_name, d.calendar_date DESC;


-- ==============================================================================
-- 4. Category Performance vs Rolling Benchmark Outperformance
-- ==============================================================================
SELECT
    f.fund_category,
    b.benchmark_name,
    COUNT(DISTINCT f.scheme_code) AS active_schemes_analyzed,
    ROUND(AVG(p.return_1m_pct) * 100, 2) AS avg_1m_return_pct,
    ROUND(AVG(p.return_3m_pct) * 100, 2) AS avg_3m_return_pct,
    ROUND(AVG(p.return_6m_pct) * 100, 2) AS avg_6m_return_pct,
    ROUND(AVG(p.return_1y_pct) * 100, 2) AS avg_1y_return_pct,
    ROUND(AVG(p.cagr_3y_pct) * 100, 2) AS avg_3y_cagr_pct
FROM FACT_ROLLING_PERFORMANCE p
JOIN DIM_FUND f ON p.scheme_code = f.scheme_code
LEFT JOIN DIM_BENCHMARK b ON f.fund_category = b.primary_category
WHERE f.plan_type = 'Direct'
GROUP BY f.fund_category, b.benchmark_name
ORDER BY avg_1y_return_pct DESC;
