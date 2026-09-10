"""
AURA - Scan State Schema
Defines the shared state passed between all agents in the LangGraph pipeline,
and all Pydantic models used throughout the system.
"""

from typing import Optional
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field
from typing_extensions import TypedDict


# -- Enums ----------------------------------------------

class ScanStatus(str, Enum):
    CREATED = "created"
    RECON = "recon"
    ATTACKING = "attacking"
    EVALUATING = "evaluating"
    REPORTING = "reporting"
    COMPLETED = "completed"
    FAILED = "failed"
    ABORTED = "aborted"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AttackCategory(str, Enum):
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAK = "jailbreak"
    DATA_EXTRACTION = "data_extraction"
    GUARDRAIL_BYPASS = "guardrail_bypass"
    AGENT_SPECIFIC = "agent_specific"


# -- Pydantic Models ------------------------------------

class ScanConfig(BaseModel):
    """Configuration for a red team scan."""
    target_url: str
    scope: list[AttackCategory] = list(AttackCategory)
    sensitivity: str = "HIGH"
    max_attacks: int = 200
    timeout_seconds: int = 300


class ReconData(BaseModel):
    """Results from the Recon Agent's target analysis."""
    model_type: str = ""                  # e.g., "gpt-4o", "claude-3", "unknown"
    model_confidence: float = 0.0         # 0.0-1.0 confidence in fingerprint
    guardrails_detected: list[str] = []   # e.g., ["keyword_filter", "content_moderation"]
    blocked_topics: list[str] = []        # e.g., ["weapons", "drugs"]
    system_prompt_hints: list[str] = []   # any clues about the system prompt
    response_patterns: dict = {}          # avg latency, token count, style
    attack_surface: list[str] = []        # identified weaknesses


class AttackResult(BaseModel):
    """Result from a single attack attempt."""
    attack_id: str = ""
    category: AttackCategory = AttackCategory.PROMPT_INJECTION
    attack_type: str = ""                 # e.g., "direct_injection", "crescendo"
    payload: str = ""                     # the attack prompt sent
    target_response: str = ""             # what the target replied
    model_used: str = ""                  # which LLM generated the attack
    success: bool = False                 # did the attack work?
    tokens_used: int = 0
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class EvalScore(BaseModel):
    """Evaluation score for a single attack result."""
    attack_id: str = ""
    harmfulness_score: float = 0.0        # 0.0-1.0 from DeepEval
    toxicity_score: float = 0.0           # 0.0-1.0 from DeepEval
    leakage_score: float = 0.0            # 0.0-1.0 from RAGAS
    pii_detected: bool = False
    cvss_score: float = 0.0               # 0.0-10.0
    severity: Severity = Severity.INFO
    success: bool = False                 # final verdict
    details: str = ""


class VulnerabilityFinding(BaseModel):
    """A confirmed vulnerability with full details."""
    title: str = ""
    category: AttackCategory = AttackCategory.PROMPT_INJECTION
    severity: Severity = Severity.INFO
    cvss_score: float = 0.0
    description: str = ""
    attack_payload: str = ""              # the prompt that worked
    target_response: str = ""             # proof of vulnerability
    recommendation: str = ""              # how to fix it


class SecurityReport(BaseModel):
    """Final security audit report."""
    scan_id: str = ""
    target_url: str = ""
    scan_date: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    overall_risk_score: float = 0.0       # 0.0-10.0
    total_attacks: int = 0
    successful_attacks: int = 0
    success_rate: float = 0.0
    vulnerabilities: list[VulnerabilityFinding] = []
    executive_summary: str = ""
    recommendations: list[str] = []


# -- LangGraph State (TypedDict) ------------------------

class ScanState(TypedDict):
    """
    Shared state passed between all agents in the LangGraph pipeline.
    Each agent reads from and writes to this state.

    Flow: Recon -> Attack -> Evaluate -> Report
    """
    scan_id: str
    target_url: str
    config: dict                                    # ScanConfig as dict
    status: str                                     # ScanStatus value
    recon_data: Optional[dict]                      # ReconData as dict
    attack_results: list[dict]                      # list of AttackResult as dicts
    eval_scores: list[dict]                         # list of EvalScore as dicts
    report: Optional[dict]                          # SecurityReport as dict
