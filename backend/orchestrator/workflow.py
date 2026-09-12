"""
AURA - LangGraph Workflow Definition
"""

from langgraph.graph import StateGraph, END

from orchestrator.state import ScanState, ScanStatus
from agents.recon_agent import run_recon
from agents.attack_agent import run_attacks
from agents.evaluator_agent import run_evaluation
from observability.logfire_setup import log_scan_event


# -- Stub Agents (Phase 4 - pass-through) --------------

async def run_report_stub(state: ScanState) -> ScanState:
    """Stub: Report Agent - will be implemented in Phase 4."""
    scan_id = state["scan_id"]
    log_scan_event(scan_id, "report_skipped", "Phase 4 - not yet implemented")
    state["status"] = ScanStatus.COMPLETED.value
    return state


# -- Conditional Routing --------------------------------

def should_attack(state: ScanState) -> str:
    recon_data = state.get("recon_data")
    if not recon_data:
        return "skip_to_report"
    return "attack"


# -- Build Workflow Graph -------------------------------

def build_workflow() -> StateGraph:
    workflow = StateGraph(ScanState)

    workflow.add_node("recon", run_recon)
    workflow.add_node("attack", run_attacks)          
    workflow.add_node("evaluate", run_evaluation)       # Phase 3 - real agent
    workflow.add_node("report", run_report_stub)        # Phase 4 stub

    workflow.set_entry_point("recon")

    workflow.add_conditional_edges(
        "recon",
        should_attack,
        {
            "attack": "attack",
            "skip_to_report": "report",
        },
    )

    workflow.add_edge("attack", "evaluate")
    workflow.add_edge("evaluate", "report")
    workflow.add_edge("report", END)

    return workflow


def compile_workflow():
    return build_workflow().compile()
