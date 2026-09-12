"""
AURA - API Schemas
Pydantic models for the REST API.
"""

from typing import Optional
from pydantic import BaseModel, Field

from orchestrator.state import AttackCategory, VulnerabilityFinding


class ScanConfigRequest(BaseModel):
    """Request payload for starting a new red team scan."""
    target_url: str = Field(..., description="The URL of the target application to scan.")
    scope: list[AttackCategory] = Field(
        default=list(AttackCategory),
        description="List of attack categories to run. Defaults to all."
    )
    max_attacks: int = Field(200, description="Maximum number of attacks to fire.")
    timeout_seconds: int = Field(300, description="Timeout for the scan in seconds.")


class ScanStatusResponse(BaseModel):
    """Response payload for checking scan progress."""
    scan_id: str
    status: str
    attacks_completed: int
    max_attacks: int
    created_at: str
    updated_at: str
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Response payload for system health check."""
    status: str
    redis_connected: bool
    pinecone_connected: bool
    version: str = "0.1.0"
