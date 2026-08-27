import re
import time
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from .s3_connector import s3_lake
from .parquet_manager import write_nav_parquet, read_manifest

AMFI_SOURCES = [
    "https://portal.amfiindia.com/spages/NAVAll.txt",
    "https://www.amfiindia.com/spages/NAVAll.txt"
]

MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

def parse_amfi_date(date_str: str) -> str:
    """Parses date string format '12-Aug-2023' to '2023-08-12'."""
    date_str = date_str.strip()
    match = re.match(r"^(\d{1,2})-([A-Za-z]{3})-(\d{4})$", date_str)
    if not match:
        raise ValueError(f"Invalid AMFI date format: {date_str}")
    
    day = match.group(1).zfill(2)
    month_name = match.group(2).lower()
    year = match.group(3)
    
    if month_name not in MONTHS:
        raise ValueError(f"Unknown month: {month_name}")
        
    month_num = str(MONTHS.index(month_name) + 1).zfill(2)
    return f"{year}-{month_num}-{day}"

def download_amfi_nav() -> str:
    """Downloads NAVAll.txt from AMFI sources with retries."""
    last_err = None
    headers = {
        "User-Agent": "FundNavigator/1.0 (Enterprise Client; https://fundnavigator.app)"
    }
    
    for url in AMFI_SOURCES:
        for attempt in range(3):
            try:
                response = requests.get(url, headers=headers, timeout=60)
                response.raise_for_status()
                text = response.text
                if len(text) < 10000:
                    raise ValueError("AMFI payload looks truncated")
                return text
            except Exception as e:
                last_err = e
                time.sleep(0.8 * (2 ** attempt))
                
    raise last_err if last_err else Exception("Could not download NAVAll.txt from AMFI")

def parse_amfi_nav_txt(text: str) -> List[Dict[str, Any]]:
    """Parses the raw text contents of NAVAll.txt."""
    rows = []
    fund_house = "Unknown AMC"
    
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
            
        # Lines without semicolons represent fund houses
        if ";" not in line:
            if "mutual fund" in line.lower():
                fund_house = line
            continue
            
        cells = line.split(";")
        if len(cells) < 6 or cells[0] == "Scheme Code":
            continue
            
        try:
            scheme_code = int(cells[0])
            nav_str = cells[4].strip()
            # If NAV is N/A or empty, skip
            if not nav_str or nav_str.lower() == "n/a":
                continue
            nav = float(nav_str)
            date = parse_amfi_date(cells[5])
            
            rows.append({
                "schemeCode": scheme_code,
                "schemeName": cells[3].strip(),
                "fundHouse": fund_house,
                "nav": nav,
                "date": date
            })
        except Exception:
            # Skip invalid lines
            continue
            
    return rows

def ingest_daily_nav() -> Dict[str, Any]:
    """Downloads daily AMFI NAV text, saves raw copy, and updates parquet partitions."""
    started_at = datetime.utcnow().isoformat() + "Z"
    errors = []
    
    try:
        text = download_amfi_nav()
        rows = parse_amfi_nav_txt(text)
    except Exception as e:
        return {
            "job": "daily-nav",
            "startedAt": started_at,
            "finishedAt": datetime.utcnow().isoformat() + "Z",
            "totalRows": 0,
            "errors": [f"Download/parse failure: {e}"]
        }
        
    as_of = rows[0]["date"] if rows else datetime.utcnow().strftime("%Y-%m-%d")
    
    # Save a raw copy to S3 data lake
    raw_key = f"nav/raw/amfi/dt={as_of}/NAVAll.txt"
    s3_lake.put_bytes(raw_key, text.encode("utf-8"), "text/plain")
    
    # Index rows by schemeCode
    nav_map = {r["schemeCode"]: r for r in rows}
    
    # Track metrics
    tracked = 0
    updated = 0
    skipped = 0
    
def classify_scheme_category(scheme_name: str) -> Optional[str]:
    """Classifies an AMFI scheme into a category key based on scheme name keywords."""
    name = scheme_name.lower()
    if "direct" not in name or "growth" not in name:
        # Prefer Direct Plan - Growth options to avoid duplicates
        return None
        
    if "large cap" in name or "bluechip" in name or "largecap" in name:
        return "large"
    if "mid cap" in name or "midcap" in name:
        return "mid"
    if "small cap" in name or "smallcap" in name:
        return "small"
    if "flexi cap" in name or "flexicap" in name:
        return "flexi"
    if "multi cap" in name or "multicap" in name:
        return "multi"
    if "hybrid" in name or "balanced" in name:
        return "hybrid"
    if "index" in name or "nifty" in name or "sensex" in name:
        return "index"
    return None

def ingest_daily_nav() -> Dict[str, Any]:
    """Downloads daily AMFI NAV text, saves raw copy, updates tracked Parquet partitions, and auto-discovers new schemes."""
    started_at = datetime.utcnow().isoformat() + "Z"
    errors = []
    
    try:
        text = download_amfi_nav()
        rows = parse_amfi_nav_txt(text)
    except Exception as e:
        return {
            "job": "daily-nav",
            "startedAt": started_at,
            "finishedAt": datetime.utcnow().isoformat() + "Z",
            "totalRows": 0,
            "errors": [f"Download/parse failure: {e}"]
        }
        
    as_of = rows[0]["date"] if rows else datetime.utcnow().strftime("%Y-%m-%d")
    
    # Save a raw copy to S3 data lake
    raw_key = f"nav/raw/amfi/dt={as_of}/NAVAll.txt"
    s3_lake.put_bytes(raw_key, text.encode("utf-8"), "text/plain")
    
    # Index rows by schemeCode
    nav_map = {r["schemeCode"]: r for r in rows}
    
    tracked = 0
    updated = 0
    skipped = 0
    
    categories = ["large", "mid", "small", "multi", "flexi", "hybrid", "index"]
    
    for category in categories:
        manifest = read_manifest(category)
        manifest_codes = {e["schemeCode"] for e in manifest}
        tracked += len(manifest)
        
        # 1. Update existing manifest entries
        for entry in manifest:
            scheme_code = entry["schemeCode"]
            row = nav_map.get(scheme_code)
            
            if not row or row["date"] <= entry.get("lastDate", ""):
                skipped += 1
                continue
                
            try:
                write_nav_parquet(
                    category=category,
                    scheme_code=scheme_code,
                    scheme_name=entry.get("schemeName") or row["schemeName"],
                    fund_house=entry.get("fundHouse") or row["fundHouse"],
                    points=[{"date": row["date"], "nav": row["nav"]}],
                    scheme_category=entry.get("schemeCategory", "")
                )
                updated += 1
            except Exception as e:
                errors.append(f"Scheme {scheme_code} write error: {e}")
                
        # 2. Auto-discover newly introduced schemes under this category
        for row in rows:
            if row["schemeCode"] in manifest_codes:
                continue
            detected_cat = classify_scheme_category(row["schemeName"])
            if detected_cat == category:
                try:
                    write_nav_parquet(
                        category=category,
                        scheme_code=row["schemeCode"],
                        scheme_name=row["schemeName"],
                        fund_house=row["fundHouse"],
                        points=[{"date": row["date"], "nav": row["nav"]}],
                        scheme_category=category.capitalize() + " Cap"
                    )
                    updated += 1
                    manifest_codes.add(row["schemeCode"])
                except Exception as e:
                    errors.append(f"Auto-discovery scheme {row['schemeCode']} error: {e}")

    return {
        "job": "daily-nav",
        "startedAt": started_at,
        "finishedAt": datetime.utcnow().isoformat() + "Z",
        "rawKey": raw_key,
        "totalRows": len(rows),
        "trackedSchemes": tracked,
        "updatedSchemes": updated,
        "skipped": skipped,
        "errors": errors
    }

