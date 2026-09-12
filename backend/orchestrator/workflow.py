"""
AURA - LangGraph Workflow Definition
Defines the agent pipeline, state transitions, and conditional routing.

Pipeline: Recon -> Attack -> Evaluate -> Report
Phase 1: Recon fully functional
Phase 2: Recon + Attack fully functional
Phase 3+: Evaluate and Report stubs will be replaced
"""

from langgraph.graph import StateGraph, END

from orchestrator.state import ScanState, ScanStatus
from agents.recon_agent import run_recon
from agents.attack_agent import run_attacks
from observability.logfire_setup import log_scan_event


# -- Stub Agents (Phase 3 & 4 - pass-through) ----------

async def run_evaluation_stub(state: ScanState) -> ScanState:
    """Stub: Evaluator Agent - will be implemented in Phase 3."""
    scan_id = state["scan_id"]
    log_scan_event(scan_id, "evaluation_skipped", "Phase 3 - not yet implemented")
    state["status"] = ScanStatus.EVALUATING.value
    return state


async def run_report_stub(state: ScanState) -> ScanState:
    """Stub: Report Agent - will be implemented in Phase 4."""
    scan_id = state["scan_id"]
    log_scan_event(scan_id, "report_skipped", "Phase 4 - not yet implemented")
    state["status"] = ScanStatus.COMPLETED.value
    return state


# -- Conditional Routing --------------------------------

def should_attack(state: ScanState) -> str:
    """Decide whether to proceed to attacks based on recon results."""
    recon_data = state.get("recon_data")
    if not recon_data:
        return "skip_to_report"
    return "attack"


# -- Build Workflow Graph -------------------------------

def build_workflow() -> StateGraph:
    """
    Build the AURA agent pipeline as a LangGraph StateGraph.

    Flow:
        START -> recon -> attack -> evaluate -> report -> END
    """
    workflow = StateGraph(ScanState)

    # Add nodes
    workflow.add_node("recon", run_recon)
    workflow.add_node("attack", run_attacks)          # Phase 2 - real agent
    workflow.add_node("evaluate", run_evaluation_stub)  # Phase 3 stub
    workflow.add_node("report", run_report_stub)        # Phase 4 stub

    # Entry point
    workflow.set_entry_point("recon")

    # Conditional routing after recon
    workflow.add_conditional_edges(
        "recon",
        should_attack,
        {
            "attack": "attack",
            "skip_to_report": "report",
        },
    )

    # Sequential flow
    workflow.add_edge("attack", "evaluate")
    workflow.add_edge("evaluate", "report")
    workflow.add_edge("report", END)

    return workflow


def compile_workflow():
    """Compile the workflow into a runnable graph."""
    return build_workflow().compile()
