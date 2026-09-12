"""
AURA - Reports API Routes
Retrieves generated JSON and PDF reports for completed scans.
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from cache.redis_manager import redis_manager

router = APIRouter(prefix="/api/v1/scans", tags=["Reports"])
REPORTS_DIR = Path(__file__).parent.parent.parent / "reports" / "output"


@router.get("/{scan_id}/report")
async def get_json_report(scan_id: str):
    """Get the full security report as JSON."""
    state = await redis_manager.get_scan(scan_id)
    if not state:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    status = state.get("status")
    if status != "completed":
        raise HTTPException(status_code=400, detail=f"Report not ready. Current status: {status}")
        
    report = state.get("report")
    if not report:
        raise HTTPException(status_code=500, detail="Scan completed but report data is missing.")
        
    return JSONResponse(content=report)


@router.get("/{scan_id}/report/pdf")
async def get_pdf_report(scan_id: str):
    """Download the full security report as a PDF."""
    state = await redis_manager.get_scan(scan_id)
    if not state:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    if state.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Report not ready.")
        
    pdf_path = REPORTS_DIR / f"{scan_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=500, detail="PDF file not found on server.")
        
    return FileResponse(
        path=pdf_path,
        filename=f"AURA_Report_{scan_id}.pdf",
        media_type="application/pdf"
    )
