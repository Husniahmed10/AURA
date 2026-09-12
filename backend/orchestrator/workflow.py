"""
AURA - LangGraph Workflow Definition
"""

from langgraph.graph import StateGraph, END

from orchestrator.state import ScanState
from agents.recon_agent import run_recon
from agents.attack_agent import run_attacks
from agents.evaluator_agent import run_evaluation
from agents.report_agent import run_report


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
    workflow.add_node("evaluate", run_evaluation)       
    workflow.add_node("report", run_report)             

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

# Instantiate the compiled graph for LangGraph Studio/CLI
graph = compile_workflow()
