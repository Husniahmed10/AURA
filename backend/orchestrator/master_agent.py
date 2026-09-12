"""
AURA - Master Agent Orchestrator
Coordinates all agents using the LangGraph workflow.
"""

import uuid
import asyncio

from orchestrator.state import ScanState, ScanConfig, ScanStatus
from orchestrator.workflow import compile_workflow
from cache.redis_manager import redis_manager
from observability.logfire_setup import log_scan_event
from config.settings import settings


async def run_scan_async(scan_id: str, config: ScanConfig) -> dict:
    """
    Run a complete AURA red team scan asynchronously.
    Used by the FastAPI endpoints.
    """
    log_scan_event(scan_id, "scan_initiated", {
        "target": config.target_url,
        "scope": [s.value for s in config.scope],
        "max_attacks": config.max_attacks,
    })

    # Connect to Redis if not connected
    if not redis_manager.redis:
        await redis_manager.connect()

    try:
        # Build initial LangGraph state
        initial_state: ScanState = {
            "scan_id": scan_id,
            "target_url": config.target_url,
            "config": config.model_dump(),
            "status": ScanStatus.CREATED.value,
            "recon_data": None,
            "attack_results": [],
            "eval_scores": [],
            "report": None,
        }

        # Compile and run the workflow
        graph = compile_workflow()

        log_scan_event(scan_id, "pipeline_started")

        # Run the full pipeline
        final_state = await graph.ainvoke(initial_state)

        log_scan_event(scan_id, "scan_completed", {
            "status": final_state["status"],
            "attacks": len(final_state.get("attack_results", [])),
        })

        return final_state

    except Exception as e:
        log_scan_event(scan_id, "scan_failed", {"error": str(e)})
        await redis_manager.update_scan_status(scan_id, ScanStatus.FAILED.value)
        raise
    # Note: we don't disconnect Redis here because the API server needs it to stay alive


async def run_scan(config: ScanConfig) -> dict:
    """Run a scan synchronously (for CLI/scripts)."""
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    await redis_manager.connect()
    try:
        await redis_manager.create_scan(scan_id, config.model_dump())
        return await run_scan_async(scan_id, config)
    finally:
        await redis_manager.disconnect()


async def run_scan_quick(target_url: str) -> dict:
    """Convenience function for testing."""
    config = ScanConfig(target_url=target_url)
    return await run_scan(config)
