from typing import List, Dict, Any
from ...api.calculations import detect_sideways_windows, calculate_metrics, get_nav_series, INDEX_MAP
from ...data_lake.parquet_manager import read_manifest

CATEGORIES_LIST = [
    {"key": "large", "label": "Large Cap", "query": "Large Cap", "categoryMatch": "large cap fund", "defaultIndex": "nifty50"},
    {"key": "mid", "label": "Mid Cap", "query": "Mid Cap", "categoryMatch": "mid cap fund", "defaultIndex": "midcap150"},
    {"key": "small", "label": "Small Cap", "query": "Small Cap", "categoryMatch": "small cap fund", "defaultIndex": "smallcap250"},
    {"key": "multi", "label": "Multi Cap", "query": "Multi Cap", "categoryMatch": "multi cap fund", "defaultIndex": "nifty500"},
    {"key": "flexi", "label": "Flexi Cap", "query": "Flexi Cap", "categoryMatch": "flexi cap fund", "defaultIndex": "nifty500"},
    {"key": "hybrid", "label": "Aggressive Hybrid", "query": "Hybrid|Equity & Debt|Equity and Debt|Balanced", "categoryMatch": "aggressive hybrid", "defaultIndex": "nifty50"}
]

def list_categories() -> Dict[str, Any]:
    """
    Lists all supported mutual fund categories and their default index proxies.
    """
    return {
        "categories": [
            {"key": c["key"], "label": c["label"], "defaultIndex": c["defaultIndex"]}
            for c in CATEGORIES_LIST
        ],
        "indices": [
            {"key": k, "label": k.upper()} for k in INDEX_MAP.keys()
        ]
    }

def get_sideways_windows_for_index(index_key: str) -> Dict[str, Any]:
    """
    Detects range-bound (sideways) market phases for a benchmark index (e.g. 'nifty50').
    Returns windows with start and end dates.
    """
    try:
        return detect_sideways_windows(index_key)
    except Exception as e:
        return {"error": str(e)}

def analyse_category_performance(category: str, start: str, end: str) -> List[Dict[str, Any]]:
    """
    Ranks mutual funds in a category (e.g. 'large', 'mid', 'small') based on performance returns 
    during a specified start and end date window.
    """
    try:
        manifest = read_manifest(category)
        if not manifest:
            return {"error": f"No funds tracked in category: {category}"}
            
        results = []
        # Limit to top 20 schemes for performance reasons in prompt size
        for entry in manifest[:30]:
            code = entry["schemeCode"]
            points = get_nav_series(code)
            if not points:
                continue
                
            # Slice points
            sliced = [p for p in points if start <= p["date"] <= end]
            if len(sliced) < 10:
                continue
                
            metrics_data = calculate_metrics(sliced)
            results.append({
                "code": code,
                "name": entry.get("schemeName"),
                "house": entry.get("fundHouse"),
                "return": metrics_data["ret"],
                "annualised": metrics_data["annualised"],
                "maxDrawdown": metrics_data["maxDD"],
                "volatility": metrics_data["volatility"]
            })
            
        # Sort by returns descending
        results = sorted(results, key=lambda x: x["return"], reverse=True)
        return results[:15]  # Return top 15
    except Exception as e:
        return {"error": str(e)}
