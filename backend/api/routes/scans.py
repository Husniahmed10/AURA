"""
AURA - Scans API Routes
Handles starting and checking the status of scans.
"""

import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks

from api.schemas import ScanConfigRequest, ScanStatusResponse
from cache.redis_manager import redis_manager
from orchestrator.state import ScanConfig
from orchestrator.master_agent import run_scan_async

router = APIRouter(prefix="/api/v1/scans", tags=["Scans"])


@router.get("", response_model=list[dict])
async def list_scans():
    """Get a list of all historical scans."""
    return await redis_manager.get_all_scans()

@router.post("", response_model=ScanStatusResponse, status_code=202)
async def start_scan(request: ScanConfigRequest, background_tasks: BackgroundTasks):
    """
    Start a new red team scan asynchronously.
    Returns a scan ID immediately.
    """
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    
    config = ScanConfig(
        target_url=request.target_url,
        scope=request.scope,
        max_attacks=request.max_attacks,
        timeout_seconds=request.timeout_seconds
    )
    
    # We create the scan in Redis immediately to get the ID
    await redis_manager.create_scan(scan_id, config.model_dump())
    
    # Kick off the LangGraph pipeline in the background
    background_tasks.add_task(run_scan_async, scan_id, config)
    
    return await get_scan_status(scan_id)


@router.get("/{scan_id}", response_model=ScanStatusResponse)
async def get_scan_status(scan_id: str):
    """Check the progress of a scan."""
    state = await redis_manager.get_scan(scan_id)
    if not state:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    return ScanStatusResponse(
        scan_id=scan_id,
        status=state.get("status", "unknown"),
        attacks_completed=len(state.get("attack_results", [])),
        max_attacks=state.get("config", {}).get("max_attacks", 200),
        created_at=state.get("created_at", ""),
        updated_at=state.get("updated_at", "")
    )


@router.delete("/{scan_id}")
async def abort_scan(scan_id: str):
    """Abort a running scan."""
    state = await redis_manager.get_scan(scan_id)
    if not state:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    await redis_manager.update_scan_status(scan_id, "aborted")
    return {"message": f"Scan {scan_id} aborted."}
