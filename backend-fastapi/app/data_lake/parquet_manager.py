import io
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional
from .s3_connector import s3_lake

# Constants mapping categories
CATEGORIES = ["large", "mid", "small", "multi", "flexi", "hybrid", "index"]

def get_parquet_path(category: str, code: int) -> str:
    return f"nav/parquet/category={category}/scheme_code={code}/nav.parquet"

def get_manifest_path(category: str) -> str:
    return f"nav/_manifest/{category}.json"

def read_nav_parquet(code: int) -> List[Dict[str, Any]]:
    """Reads historical NAV points from Parquet. Defaults to looking in all categories in listing."""
    # First, list objects to find where this scheme code is stored
    all_objects = s3_lake.list_objects("nav/parquet/")
    key = None
    for obj in all_objects:
        if f"scheme_code={code}" in obj["key"] and obj["key"].endswith(".parquet"):
            key = obj["key"]
            break
            
    if not key:
        return []
        
    parquet_bytes = s3_lake.get_bytes(key)
    if not parquet_bytes:
        return []
        
    try:
        buffer = io.BytesIO(parquet_bytes)
        df = pd.read_parquet(buffer, engine="pyarrow")
        # Format dates and float NAVs
        df["date"] = df["date"].astype(str)
        df["nav"] = df["nav"].astype(float)
        points = df.to_dict(orient="records")
        # Sort by date ascending
        return sorted(points, key=lambda x: x["date"])
    except Exception as e:
        print(f"[Parquet] Error reading scheme {code}: {e}")
        return []

def write_nav_parquet(
    category: str,
    scheme_code: int,
    scheme_name: str,
    fund_house: str,
    points: List[Dict[str, Any]],
    scheme_category: str = ""
) -> Dict[str, Any]:
    """Merges new NAV points, writes them as Parquet to S3, and updates category manifest."""
    # 1. Read existing points to merge
    existing = read_nav_parquet(scheme_code)
    
    # 2. Merge points on date unique keys
    merged_map = {p["date"]: p["nav"] for p in existing}
    for p in points:
        merged_map[p["date"]] = float(p["nav"])
        
    merged_points = [{"date": k, "nav": v} for k, v in merged_map.items()]
    merged_points = sorted(merged_points, key=lambda x: x["date"])
    
    if not merged_points:
        raise ValueError(f"No NAV points to store for scheme {scheme_code}")
        
    # 3. Create DataFrame and convert to Parquet
    df = pd.DataFrame(merged_points)
    df["date"] = df["date"].astype(str)
    df["nav"] = df["nav"].astype(float)
    df["scheme_code"] = int(scheme_code)
    
    buffer = io.BytesIO()
    df.to_parquet(buffer, engine="pyarrow", index=False)
    parquet_bytes = buffer.getvalue()
    
    # 4. Upload to S3
    key = get_parquet_path(category, scheme_code)
    s3_lake.put_bytes(key, parquet_bytes, "application/vnd.apache.parquet")
    
    # 5. Build manifest entry
    entry = {
        "schemeCode": int(scheme_code),
        "schemeName": scheme_name,
        "fundHouse": fund_house,
        "schemeCategory": scheme_category,
        "firstDate": merged_points[0]["date"],
        "lastDate": merged_points[-1]["date"],
        "rows": len(merged_points),
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    }
    
    # 6. Upsert entry to manifest
    upsert_manifest(category, entry)
    return entry

def read_manifest(category: str) -> List[Dict[str, Any]]:
    manifest_key = get_manifest_path(category)
    manifest = s3_lake.get_json(manifest_key)
    return manifest if manifest is not None else []

def upsert_manifest(category: str, entry: Dict[str, Any]) -> None:
    current = read_manifest(category)
    # Filter out current code and append new entry, sort by rows descending
    next_manifest = [e for e in current if e["schemeCode"] != entry["schemeCode"]]
    next_manifest.append(entry)
    next_manifest = sorted(next_manifest, key=lambda x: x.get("rows", 0), reverse=True)
    
    manifest_key = get_manifest_path(category)
    s3_lake.put_json(manifest_key, next_manifest)
