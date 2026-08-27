from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..data_lake.parquet_manager import read_manifest, read_nav_parquet
from ..data_lake.amfi_scraper import ingest_daily_nav
from .calculations import detect_sideways_windows, calculate_metrics, get_nav_series
from ..database import get_db, AdminSetting

router = APIRouter(prefix="/api/v1")

@router.post("/ingest", summary="Run daily AMFI data lake ingest")
def run_ingest():
    try:
        report = ingest_daily_nav()
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

@router.get("/sideways/{index_key}", summary="Get detected sideways windows and series")
def get_sideways(
    index_key: str,
    band_pct: float = Query(3.0, description="Sideways band range in percentage (+- value)"),
    min_days: int = Query(90, description="Minimum duration of window in days"),
    max_drift: float = Query(5.0, description="Maximum price drift within the window in percentage")
):
    try:
        data = detect_sideways_windows(
            index_key=index_key,
            band_pct=band_pct,
            min_days=min_days,
            max_drift=max_drift
        )
        return data
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect sideways windows: {e}")

@router.get("/categories/{category}", summary="List manifest entries for a category")
def get_category_manifest(category: str):
    try:
        manifest = read_manifest(category)
        return manifest
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read category manifest: {e}")

@router.get("/schemes/{code}", summary="Get historical NAV series for a scheme")
def get_scheme_nav(code: int):
    points = get_nav_series(code)
    if not points:
        raise HTTPException(status_code=404, detail=f"Scheme {code} NAV data not found")
    return {"schemeCode": code, "points": points}

@router.get("/schemes/{code}/analysis", summary="Analyze fund metrics over custom window")
def get_scheme_analysis(
    code: int,
    start: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end: str = Query(..., description="End date in YYYY-MM-DD format")
):
    points = get_nav_series(code)
    if not points:
        raise HTTPException(status_code=404, detail=f"Scheme {code} NAV data not found")
        
    # Slice points
    sliced = [p for p in points if start <= p["date"] <= end]
    if len(sliced) < 2:
        return {
            "schemeCode": code,
            "ret": 0.0,
            "annualised": 0.0,
            "maxDD": 0.0,
            "volatility": 0.0,
            "days": 0,
            "error": "Insufficient NAV points in the selected range"
        }
        
    analysis = calculate_metrics(sliced)
    analysis["schemeCode"] = code
    return analysis

from pydantic import BaseModel
from typing import List, Optional
from ..agents import run_agentic_analysis

class Message(BaseModel):
    role: str
    content: str

class AnalystRequest(BaseModel):
    prompt: str
    history: Optional[List[Message]] = None

@router.post("/analyst", summary="Run Agentic AI Analyst check")
def run_analyst(payload: AnalystRequest):
    try:
        history_list = []
        if payload.history:
            history_list = [{"role": m.role, "content": m.content} for m in payload.history]
        report = run_agentic_analysis(payload.prompt, history_list)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Agent execution failed: {e}")

class SettingsUpdateRequest(BaseModel):
    timescaledb_sync_years: str

@router.get("/admin/settings", summary="Get administrator settings")
def get_settings(db: Session = Depends(get_db)):
    sync_years = db.query(AdminSetting).filter(AdminSetting.key == "timescaledb_sync_years").first()
    return {
        "timescaledb_sync_years": sync_years.value if sync_years else "3"
    }

@router.post("/admin/settings", summary="Update administrator settings")
def update_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    if payload.timescaledb_sync_years not in ["2", "3"]:
        raise HTTPException(status_code=400, detail="Invalid sync years selection. Must be '2' or '3'.")
        
    sync_years = db.query(AdminSetting).filter(AdminSetting.key == "timescaledb_sync_years").first()
    if not sync_years:
        sync_years = AdminSetting(key="timescaledb_sync_years", value=payload.timescaledb_sync_years)
        db.add(sync_years)
    else:
        sync_years.value = payload.timescaledb_sync_years
        
    db.commit()
    return {"status": "success", "timescaledb_sync_years": sync_years.value}

