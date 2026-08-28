import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add backend directory to module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load .env BEFORE importing app modules so DATABASE_URL / AWS creds are available at import time.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.database import SessionLocal, init_db, Fund, NavHistory, AdminSetting
from app.data_lake.parquet_manager import write_nav_parquet, read_manifest
from app.data_lake.amfi_scraper import ingest_daily_nav
from app.api.calculations import fetch_nav_from_public_api, INDEX_MAP

import requests

# Benchmark indices and popular sample scheme codes across categories
POPULAR_SCHEMES = [
    # Benchmark Index Proxies
    {"code": 120716, "name": "Nifty 50 Index Proxy", "category": "index", "house": "Index Proxy AMC"},
    {"code": 148726, "name": "Nifty Midcap 150 Index Proxy", "category": "index", "house": "Index Proxy AMC"},
    {"code": 148519, "name": "Nifty Smallcap 250 Index Proxy", "category": "index", "house": "Index Proxy AMC"},
    {"code": 152731, "name": "Nifty 500 Index Proxy", "category": "index", "house": "Index Proxy AMC"},
]

CATEGORY_KEYWORDS = {
    "large": ["large cap", "bluechip", "largecap", "top 100"],
    "mid": ["mid cap", "midcap", "emerging equity"],
    "small": ["small cap", "smallcap"],
    "multi": ["multi cap", "multicap"],
    "flexi": ["flexi cap", "flexicap"],
    "hybrid": ["hybrid", "balanced advantage", "aggressive hybrid"],
    "index": ["nifty", "sensex", "index fund", "index", "bse", "equal weight", "midcap 150", "smallcap 250", "nifty 500"]
}

def discover_all_category_schemes() -> list:
    """Discovers all Direct Plan - Growth mutual fund schemes across categories from AMFI directory."""
    print("Fetching master mutual fund directory from public API (https://api.mfapi.in/mf)...")
    try:
        res = requests.get("https://api.mfapi.in/mf", timeout=30)
        directory = res.json()
    except Exception as e:
        print(f"Failed to fetch public directory: {e}. Falling back to popular schemes list.")
        return POPULAR_SCHEMES

    discovered = list(POPULAR_SCHEMES)
    seen_codes = {s["code"] for s in discovered}

    for item in directory:
        code = item.get("schemeCode")
        name = item.get("schemeName", "")
        if not code or code in seen_codes:
            continue

        name_lower = name.lower()
        if "direct" not in name_lower or "growth" not in name_lower:
            continue
        if any(w in name_lower for w in ["idcw", "dividend", "bonus", "payout", "etf", "fund of fund", "fof"]):
            continue

        for cat_key, keywords in CATEGORY_KEYWORDS.items():
            if any(k in name_lower for k in keywords):
                house = name.split(" Fund")[0].strip() if " Fund" in name else "Mutual Fund"
                discovered.append({
                    "code": code,
                    "name": name,
                    "category": cat_key,
                    "house": house
                })
                seen_codes.add(code)
                break

    print(f"Total schemes discovered across all target categories: {len(discovered)}")
    return discovered

from concurrent.futures import ThreadPoolExecutor, as_completed

def process_single_scheme(item: dict, cutoff_date: str) -> tuple:
    code = item["code"]
    name = item["name"]
    cat = item["category"]
    house = item["house"]
    
    try:
        points = fetch_nav_from_public_api(code)
        if not points or len(points) < 50:
            return (code, name, False, 0, 0, f"insufficient points ({len(points) if points else 0})")

        # 1. Write FULL deep historical NAV series to S3 Parquet Lake
        write_nav_parquet(
            category=cat,
            scheme_code=code,
            scheme_name=name,
            fund_house=house,
            points=points,
            scheme_category=cat.capitalize() + " Cap"
        )

        # 2. Filter the rolling window for DB seeding (fast-response hot data)
        db_points = [p for p in points if p["date"] >= cutoff_date]
        return (code, name, True, len(points), db_points, item)
    except Exception as e:
        return (code, name, False, 0, 0, str(e))

def run_historical_ingestion(years: int = 3):
    print(f"=== Starting Fund Navigator {years}-Year Historical Data Ingestion for ALL Category Schemes ===")
    
    init_db()
    db = SessionLocal()
    
    setting = db.query(AdminSetting).filter(AdminSetting.key == "timescaledb_sync_years").first()
    if not setting:
        setting = AdminSetting(key="timescaledb_sync_years", value=str(years))
        db.add(setting)
    else:
        setting.value = str(years)
    db.commit()
    
    cutoff_date = (datetime.utcnow() - timedelta(days=years * 365)).strftime("%Y-%m-%d")
    print(f"Ingesting NAV data on or after: {cutoff_date}")
    
    all_schemes = discover_all_category_schemes()
    total_records = 0
    success_count = 0
    
    print(f"Starting parallel ingestion for {len(all_schemes)} schemes with 20 threads...", flush=True)
    
    db_items_to_seed = []
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {
            executor.submit(process_single_scheme, item, cutoff_date): item
            for item in all_schemes
        }
        
        for idx, future in enumerate(as_completed(futures), 1):
            code, name, ok, total_pts, db_points, extra = future.result()
            if ok:
                success_count += 1
                total_records += len(db_points)
                db_items_to_seed.append((extra, db_points))
                if idx % 10 == 0 or idx == len(all_schemes):
                    print(f"[{idx}/{len(all_schemes)}] Processed scheme {code} ({name[:35]}...) - {total_pts} pts (S3 Parquet)", flush=True)
            else:
                if idx % 20 == 0:
                    print(f"[{idx}/{len(all_schemes)}] Skipped scheme {code}: {extra}", flush=True)

    # Bulk seed DB: fund metadata + rolling-window NAV rows (fast-response hot data)
    print(f"Seeding {len(db_items_to_seed)} active schemes into DB...", flush=True)
    seeded_nav_rows = 0
    for item, db_points in db_items_to_seed:
        code = item["code"]
        name = item["name"]
        cat = item["category"]
        house = item["house"]
        fund = db.query(Fund).filter(Fund.scheme_code == code).first()
        if not fund:
            fund = Fund(scheme_code=code, scheme_name=name, fund_house=house, category=cat)
            db.add(fund)
            db.flush()

        # Replace existing hot-window rows for this scheme, then bulk-insert fresh ones.
        db.query(NavHistory).filter(NavHistory.scheme_code == code).delete(synchronize_session=False)
        nav_rows = [
            NavHistory(
                scheme_code=code,
                nav_date=datetime.strptime(p["date"], "%Y-%m-%d").date(),
                nav=float(p["nav"]),
            )
            for p in db_points
        ]
        db.bulk_save_objects(nav_rows)
        seeded_nav_rows += len(nav_rows)
        if seeded_nav_rows and seeded_nav_rows % 50000 < 750:
            db.commit()
    db.commit()
    db.close()

    print(f"=== All-Category Ingestion Complete! {success_count}/{len(all_schemes)} schemes processed, Total DB Records: {total_records}, NavHistory rows seeded: {seeded_nav_rows} ===", flush=True)




if __name__ == "__main__":
    years_arg = 3
    if len(sys.argv) > 1:
        try:
            years_arg = int(sys.argv[1])
        except ValueError:
            pass
    run_historical_ingestion(years_arg)
