import numpy as np
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ..data_lake.parquet_manager import read_nav_parquet

BASE_API_URL = "https://api.mfapi.in"
RISK_FREE_RATE = 6.0  # 6% annual risk-free rate

# How many years of NAV history are kept hot in the DB (fast path). Older data is served from parquet.
DB_RETENTION_YEARS = 3

INDEX_MAP = {
    "nifty50": {"code": 120716, "fallbacks": [118881]},
    "midcap150": {"code": 148726, "fallbacks": [147622]},
    "smallcap250": {"code": 148519, "fallbacks": [151727]},
    "nifty500": {"code": 152731, "fallbacks": [147625]}
}

def fetch_nav_from_public_api(code: int) -> List[Dict[str, Any]]:
    """Fetches historical NAV points from public api.mfapi.in."""
    try:
        url = f"{BASE_API_URL}/mf/{code}"
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        data = res.json().get("data", [])
        
        points = []
        for d in data:
            try:
                date_str = datetime.strptime(d["date"], "%d-%m-%Y").strftime("%Y-%m-%d")
                points.append({
                    "date": date_str,
                    "nav": float(d["nav"])
                })
            except Exception:
                continue
        # Sort chronologically (oldest first)
        return sorted(points, key=lambda x: x["date"])
    except Exception as e:
        print(f"[API] Fallback request failed for {code}: {e}")
        return []

def get_nav_series(code: int) -> List[Dict[str, Any]]:
    """Gets NAV history, DB-first (3-year hot window) then parquet (full history), then public API."""
    points: List[Dict[str, Any]] = []
    db_cutoff = (datetime.utcnow() - timedelta(days=DB_RETENTION_YEARS * 365)).date()

    # 1. Fast path: read the 3-year hot window from the DB.
    try:
        from ..database import SessionLocal, NavHistory
        db = SessionLocal()
        try:
            rows = (
                db.query(NavHistory)
                .filter(NavHistory.scheme_code == code)
                .order_by(NavHistory.nav_date.asc())
                .all()
            )
            points = [{"date": r.nav_date.strftime("%Y-%m-%d"), "nav": float(r.nav)} for r in rows]
        finally:
            db.close()
    except Exception as e:
        print(f"[DB] nav_history read failed for {code}: {e}")
        points = []

    if len(points) > 100:
        # DB only holds the recent window; if the caller needs history older than the
        # DB cutoff, merge the full parquet series underneath.
        if points[0]["date"] <= db_cutoff.strftime("%Y-%m-%d"):
            return points
        try:
            lake_points = read_nav_parquet(code)
        except Exception:
            lake_points = []
        if len(lake_points) > len(points):
            seen = {p["date"] for p in points}
            merged = [p for p in lake_points if p["date"] not in seen] + points
            return sorted(merged, key=lambda x: x["date"])
        return points

    # 2. Full history from the data lake parquet.
    try:
        lake_points = read_nav_parquet(code)
    except Exception:
        lake_points = []
    if len(lake_points) > 100:
        return lake_points

    # 3. Fallback to public API
    return fetch_nav_from_public_api(code)

def calculate_metrics(points: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculates performance returns, drawdown, and annualised volatility."""
    if len(points) < 2:
        return {"ret": 0.0, "annualised": 0.0, "maxDD": 0.0, "volatility": 0.0, "days": 0}
        
    first_nav = points[0]["nav"]
    last_nav = points[-1]["nav"]
    ret = (last_nav / first_nav - 1.0) * 100.0
    
    d1 = datetime.strptime(points[0]["date"], "%Y-%m-%d")
    d2 = datetime.strptime(points[-1]["date"], "%Y-%m-%d")
    days = max(1, (d2 - d1).days)
    
    # Annualised CAGR
    annualised = ((last_nav / first_nav) ** (365.25 / days) - 1.0) * 100.0
    
    # Maximum drawdown and daily returns
    peak = first_nav
    max_dd = 0.0
    daily_returns = []
    
    for i, p in enumerate(points):
        nav = p["nav"]
        peak = max(peak, nav)
        drawdown = (peak - nav) / peak
        max_dd = max(max_dd, drawdown)
        if i > 0:
            daily_returns.append(nav / points[i - 1]["nav"] - 1.0)
            
    # Volatility
    if len(daily_returns) > 1:
        mean_ret = np.mean(daily_returns)
        std_ret = np.std(daily_returns, ddof=1)
        volatility = std_ret * np.sqrt(252) * 100.0
    else:
        volatility = 0.0
        
    return {
        "ret": ret,
        "annualised": annualised,
        "maxDD": max_dd * 100.0,
        "volatility": volatility,
        "days": days
    }

def detect_sideways_windows(
    index_key: str,
    band_pct: float = 3.0,
    min_days: int = 90,
    max_drift: float = 5.0
) -> Dict[str, Any]:
    """Detects sideways windows for a given index key with custom parameters."""
    index_meta = INDEX_MAP.get(index_key)
    if not index_meta:
        raise ValueError(f"Unknown index key: {index_key}")
        
    codes_to_try = [index_meta["code"]] + index_meta.get("fallbacks", [])
    points = []
    for code in codes_to_try:
        points = get_nav_series(code)
        if len(points) > 100:
            break
            
    if not points:
        return {"windows": [], "series": [], "first": "", "last": ""}
        
    found = []
    n = len(points)
    
    # Calculate the fraction limit representing the total band size (e.g. +-3% is a 6% total band)
    band_limit = (2.0 * band_pct) / 100.0
    
    # Sliding window search (step size 5 days)
    for i in range(0, n, 5):
        hi = points[i]["nav"]
        lo = points[i]["nav"]
        j = i
        while j + 1 < n:
            nav = points[j + 1]["nav"]
            nhi = max(hi, nav)
            nlo = min(lo, nav)
            # Limit band to custom high-to-low range
            if (nhi - nlo) / nlo > band_limit:
                break
            hi = nhi
            lo = nlo
            j += 1
            
        d1 = datetime.strptime(points[i]["date"], "%Y-%m-%d")
        d2 = datetime.strptime(points[j]["date"], "%Y-%m-%d")
        days = (d2 - d1).days
        drift = (points[j]["nav"] / points[i]["nav"] - 1.0) * 100.0
        
        # Qualifies if minimum custom days and drift within custom limits
        if days >= min_days and abs(drift) <= max_drift:
            found.append({
                "i": i,
                "j": j,
                "drift": drift,
                "band": ((hi - lo) / lo) * 100.0
            })
            
    # Sort windows by duration descending
    found = sorted(found, key=lambda w: (w["j"] - w["i"]), reverse=True)
    
    picked = []
    for w in found:
        # Prevent overlapping windows
        overlap = False
        for p in picked:
            overlap_len = min(p["j"], w["j"]) - max(p["i"], w["i"])
            if overlap_len > 0:
                overlap = True
                break
        if not overlap:
            picked.append(w)
            if len(picked) == 5:
                break
                
    # Sort chronological
    picked = sorted(picked, key=lambda w: w["i"], reverse=True)
    
    windows = []
    for w in picked:
        d1 = datetime.strptime(points[w["i"]]["date"], "%Y-%m-%d")
        d2 = datetime.strptime(points[w["j"]]["date"], "%Y-%m-%d")
        windows.append({
            "start": points[w["i"]]["date"],
            "end": points[w["j"]]["date"],
            "days": (d2 - d1).days,
            "drift": w["drift"],
            "band": w["band"]
        })
        
    # Sample index series points for plotting (approx 260 points total)
    step = max(1, n // 260)
    series = [{"date": p["date"], "value": p["nav"]} for idx, p in enumerate(points) if idx % step == 0]
    
    return {
        "windows": windows,
        "series": series,
        "first": points[0]["date"],
        "last": points[-1]["date"]
    }
