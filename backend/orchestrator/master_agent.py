"""
AURA - Master Agent Orchestrator
Coordinates all agents using the LangGraph workflow.
Entry point for running a complete red team scan.
"""

import uuid

from orchestrator.state import ScanState, ScanConfig, ScanStatus
from orchestrator.workflow import compile_workflow
from cache.redis_manager import redis_manager
from observability.logfire_setup import log_scan_event, setup_logfire
from config.settings import settings


async def run_scan(config: ScanConfig) -> dict:
    """
    Run a complete AURA red team scan.

    1. Generate scan_id
    2. Initialize state in Redis
    3. Run the LangGraph pipeline (Recon -> Attack -> Evaluate -> Report)
    4. Return final scan state

    Args:
        config: ScanConfig with target_url, scope, max_attacks, etc.

    Returns:
        Final scan state dict with all results.
    """
    # Generate unique scan ID
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"

    log_scan_event(scan_id, "scan_initiated", {
        "target": config.target_url,
        "scope": [s.value for s in config.scope],
        "max_attacks": config.max_attacks,
    })

    # Connect to Redis
    await redis_manager.connect()

    try:
        # Create scan in Redis
        await redis_manager.create_scan(scan_id, config.model_dump())

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

        # Update Redis with final state
        await redis_manager.update_scan_status(scan_id, ScanStatus.COMPLETED.value)

        log_scan_event(scan_id, "scan_completed", {
            "status": final_state["status"],
            "attacks": len(final_state.get("attack_results", [])),
        })

        return final_state

    except Exception as e:
        log_scan_event(scan_id, "scan_failed", {"error": str(e)})
        await redis_manager.update_scan_status(scan_id, ScanStatus.FAILED.value)
        raise

    finally:
        await redis_manager.disconnect()


async def run_scan_quick(target_url: str) -> dict:
    """
    Quick scan with default settings.
    Convenience function for testing.

    Usage:
        import asyncio
        from orchestrator.master_agent import run_scan_quick
        result = asyncio.run(run_scan_quick("http://localhost:8001"))
    """
    config = ScanConfig(target_url=target_url)
    return await run_scan(config)
