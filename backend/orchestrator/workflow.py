"""
AURA - LangGraph Workflow Definition
Defines the agent pipeline, state transitions, and conditional routing.

Pipeline: Recon -> Attack -> Evaluate -> Report
"""

from langgraph.graph import StateGraph, END

from orchestrator.state import ScanState, ScanStatus
from agents.recon_agent import run_recon
from observability.logfire_setup import log_scan_event


# -- Stub Agents (Phase 1 - pass-through) ---------------

async def run_attacks_stub(state: ScanState) -> ScanState:
    """Stub: Attack Agent - will be implemented in Phase 2."""
    scan_id = state["scan_id"]
    log_scan_event(scan_id, "attack_skipped", "Phase 2 - not yet implemented")
    state["status"] = ScanStatus.ATTACKING.value
    return state


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

    # If recon found attack surface, proceed to attacks
    if recon_data.get("attack_surface"):
        return "attack"

    # If no weaknesses found, still attack (might find something)
    return "attack"


# -- Build Workflow Graph -------------------------------

def build_workflow() -> StateGraph:
    """
    Build the AURA agent pipeline as a LangGraph StateGraph.

    Flow:
        START -> recon -> (should_attack?) -> attack -> evaluate -> report -> END
    """
    workflow = StateGraph(ScanState)

    # Add nodes
    workflow.add_node("recon", run_recon)
    workflow.add_node("attack", run_attacks_stub)
    workflow.add_node("evaluate", run_evaluation_stub)
    workflow.add_node("report", run_report_stub)

    # Set entry point
    workflow.set_entry_point("recon")

    # Add edges with conditional routing after recon
    workflow.add_conditional_edges(
        "recon",
        should_attack,
        {
            "attack": "attack",
            "skip_to_report": "report",
        },
    )

    # Sequential flow: attack -> evaluate -> report -> END
    workflow.add_edge("attack", "evaluate")
    workflow.add_edge("evaluate", "report")
    workflow.add_edge("report", END)

    return workflow


def compile_workflow():
    """Compile the workflow into a runnable graph."""
    workflow = build_workflow()
    return workflow.compile()
