"""
AURA - Agent Unit Tests
Tests the LangGraph agent nodes by mocking the LLM gateway and HTTP clients.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from orchestrator.state import ScanState, ScanStatus, AttackCategory
from agents.recon_agent import run_recon
from agents.attack_agent import run_attacks
from agents.report_agent import run_report


@pytest.fixture
def base_state() -> ScanState:
    return {
        "scan_id": "test_scan_123",
        "target_url": "http://localhost:8001",
        "config": {
            "target_url": "http://localhost:8001",
            "scope": [AttackCategory.PROMPT_INJECTION.value],
            "max_attacks": 5
        },
        "status": ScanStatus.CREATED.value,
        "recon_data": None,
        "attack_results": [],
        "eval_scores": [],
        "report": None
    }


@pytest.mark.asyncio
@patch("agents.recon_agent.httpx.AsyncClient.post")
@patch("agents.recon_agent.redis_manager")
async def test_recon_agent(mock_redis, mock_post, base_state):
    """Test that the recon agent correctly populates recon_data via HTTP probing."""
    mock_redis.update_scan_status = AsyncMock()
    mock_redis.update_scan_field = AsyncMock()
    
    # Mock HTTP response
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"response": "I am based on an OpenAI architecture.", "blocked": False}
    mock_post.return_value = mock_resp

    # Run agent
    new_state = await run_recon(base_state)

    # Assertions
    assert new_state["recon_data"] is not None
    assert new_state["status"] == ScanStatus.RECON.value
    # recon_agent identifies standard patterns based on the mocked response
    # 'OpenAI' should be recognized in the response


@pytest.mark.asyncio
@patch("agents.report_agent.generate_pdf")
@patch("agents.report_agent.generate_json")
@patch("agents.report_agent.get_llm")
@patch("agents.report_agent.redis_manager")
async def test_report_agent(mock_redis, mock_get_llm, mock_json, mock_pdf, base_state):
    """Test that the report agent correctly calculates risk scores."""
    base_state["eval_scores"] = [
        {"attack_id": "1", "success": True, "category": "data_extraction", "cvss_score": 9.0},
        {"attack_id": "2", "success": False, "category": "prompt_injection", "cvss_score": 0.0}
    ]
    base_state["attack_results"] = [
        {"attack_id": "1", "category": "data_extraction"},
        {"attack_id": "2", "category": "prompt_injection"}
    ]
    
    mock_llm = MagicMock()
    mock_invoke = AsyncMock()
    mock_invoke.return_value.content = "Mock Executive Summary"
    mock_llm.ainvoke = mock_invoke
    mock_get_llm.return_value = mock_llm

    mock_redis.update_scan_status = AsyncMock()
    mock_redis.update_scan_field = AsyncMock()
    mock_redis.update_scan_field = AsyncMock()

    new_state = await run_report(base_state)

    report = new_state["report"]
    assert report["overall_risk_score"] > 0
    assert report["successful_attacks"] == 1
    assert report["total_attacks"] == 2
    assert report["success_rate"] == 50.0
    assert report["executive_summary"] == "Mock Executive Summary"
