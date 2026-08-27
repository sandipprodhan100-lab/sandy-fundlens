import os
import sys
from datetime import datetime, timedelta

# Add backend directory to module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, init_db, Fund, NavHistory, AdminSetting
from app.data_lake.parquet_manager import write_nav_parquet, read_manifest
from app.data_lake.amfi_scraper import ingest_daily_nav
from app.api.calculations import fetch_nav_from_public_api, INDEX_MAP

# Benchmark indices and popular sample scheme codes across categories
POPULAR_SCHEMES = [
    # Benchmark Index Proxies
    {"code": 120716, "name": "Nifty 50 Index Proxy", "category": "index", "house": "Index Proxy AMC"},
    {"code": 148726, "name": "Nifty Midcap 150 Index Proxy", "category": "index", "house": "Index Proxy AMC"},
    {"code": 148519, "name": "Nifty Smallcap 250 Index Proxy", "category": "index", "house": "Index Proxy AMC"},
    
    # Large Cap
    {"code": 119598, "name": "Mirae Asset Large Cap Fund - Direct Plan - Growth", "category": "large", "house": "Mirae Asset Mutual Fund"},
    {"code": 120503, "name": "SBI Bluechip Fund - Direct Plan - Growth", "category": "large", "house": "SBI Mutual Fund"},
    {"code": 118989, "name": "ICICI Prudential Bluechip Fund - Direct Plan - Growth", "category": "large", "house": "ICICI Prudential Mutual Fund"},
    
    # Mid Cap
    {"code": 118834, "name": "HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth", "category": "mid", "house": "HDFC Mutual Fund"},
    {"code": 120585, "name": "Kotak Emerging Equity Fund - Direct Plan - Growth", "category": "mid", "house": "Kotak Mahindra Mutual Fund"},
    
    # Small Cap
    {"code": 125497, "name": "Nippon India Small Cap Fund - Direct Plan - Growth", "category": "small", "house": "Nippon India Mutual Fund"},
    {"code": 120594, "name": "Axis Small Cap Fund - Direct Plan - Growth", "category": "small", "house": "Axis Mutual Fund"},
    
    # Flexi & Multi Cap
    {"code": 122639, "name": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth", "category": "flexi", "house": "PPFAS Mutual Fund"},
    {"code": 120847, "name": "Quant Active Fund - Direct Plan - Growth", "category": "multi", "house": "Quant Mutual Fund"}
]

def run_historical_ingestion(years: int = 3):
    print(f"=== Starting Fund Navigator {years}-Year Historical Data Ingestion ===")
    
    # 1. Initialize DB tables
    init_db()
    db = SessionLocal()
    
    # Store settings
    setting = db.query(AdminSetting).filter(AdminSetting.key == "timescaledb_sync_years").first()
    if not setting:
        setting = AdminSetting(key="timescaledb_sync_years", value=str(years))
        db.add(setting)
    else:
        setting.value = str(years)
    db.commit()
    
    cutoff_date = (datetime.utcnow() - timedelta(days=years * 365)).strftime("%Y-%m-%d")
    print(f"Ingesting NAV data on or after: {cutoff_date}")
    
    total_records = 0
    for item in POPULAR_SCHEMES:
        code = item["code"]
        name = item["name"]
        cat = item["category"]
        house = item["house"]
        
        print(f"Fetching NAV history for scheme {code} ({name})...")
        points = fetch_nav_from_public_api(code)
        
        # Filter for requested years history
        filtered_points = [p for p in points if p["date"] >= cutoff_date]
        if not filtered_points:
            print(f"Warning: No points found for scheme {code}")
            continue
            
        print(f"Fetched {len(filtered_points)} points for scheme {code}.")
        
        # 2. Write to S3 Parquet Lake
        write_nav_parquet(
            category=cat,
            scheme_code=code,
            scheme_name=name,
            fund_house=house,
            points=filtered_points,
            scheme_category=cat.capitalize() + " Cap"
        )
        
        # 3. Seed Relational Database tables (Fund & NavHistory)
        fund = db.query(Fund).filter(Fund.scheme_code == code).first()
        if not fund:
            fund = Fund(scheme_code=code, scheme_name=name, fund_house=house, category=cat)
            db.add(fund)
            db.commit()
            
        # Bulk upsert NAV history records into DB
        existing_dates = set(
            row[0] for row in db.query(NavHistory.nav_date)
            .filter(NavHistory.scheme_code == code).all()
        )
        
        new_nav_objects = []
        for p in filtered_points:
            dt = datetime.strptime(p["date"], "%Y-%m-%d").date()
            if dt not in existing_dates:
                new_nav_objects.append(
                    NavHistory(scheme_code=code, nav_date=dt, nav=p["nav"])
                )
                
        if new_nav_objects:
            db.bulk_save_objects(new_nav_objects)
            db.commit()
            
        total_records += len(filtered_points)
        
    db.close()
    print(f"=== Historical Ingestion Complete! Total NAV Records Seeded: {total_records} ===")

if __name__ == "__main__":
    years_arg = 3
    if len(sys.argv) > 1:
        try:
            years_arg = int(sys.argv[1])
        except ValueError:
            pass
    run_historical_ingestion(years_arg)
