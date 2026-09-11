"""
AURA - Logfire Observability Setup
Configures Pydantic Logfire for tracing and monitoring.
Every agent action, LLM call, and state transition is recorded.
"""

import logfire
import os
from functools import wraps
from typing import Any

from config.settings import settings


def setup_logfire():
    """Initialize Logfire with AURA project settings."""
    if settings.LOGFIRE_TOKEN:
        logfire.configure(
            token=settings.LOGFIRE_TOKEN,
            service_name="aura",
            service_version="0.1.0",
        )
    else:
        # Suppress warnings if no token configured
        os.environ["LOGFIRE_IGNORE_NO_CONFIG"] = "1"


def instrument_fastapi(app):
    """Add Logfire tracing middleware to FastAPI app."""
    if settings.LOGFIRE_TOKEN:
        logfire.instrument_fastapi(app)


def agent_span(agent_name: str):
    """
    Decorator to trace agent execution with Logfire.

    Usage:
        @agent_span("recon")
        async def run_recon(state):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if settings.LOGFIRE_TOKEN:
                with logfire.span(
                    f"agent.{agent_name}",
                    agent=agent_name,
                ):
                    return await func(*args, **kwargs)
            else:
                return await func(*args, **kwargs)
        return wrapper
    return decorator


def log_llm_call(
    agent: str,
    model: str,
    prompt: str,
    response: str,
    tokens_used: int = 0,
    scan_id: str = "",
):
    """Log an LLM call with structured data."""
    if settings.LOGFIRE_TOKEN:
        logfire.info(
            "LLM call: {agent} -> {model}",
            agent=agent,
            model=model,
            prompt_length=len(prompt),
            response_length=len(response),
            tokens_used=tokens_used,
            scan_id=scan_id,
        )


def log_attack(
    scan_id: str,
    attack_type: str,
    payload: str,
    success: bool,
    severity: str = "",
):
    """Log an attack attempt with result."""
    if settings.LOGFIRE_TOKEN:
        logfire.info(
            "Attack: {attack_type} | success={success}",
            scan_id=scan_id,
            attack_type=attack_type,
            payload_length=len(payload),
            success=success,
            severity=severity,
        )


def log_scan_event(scan_id: str, event: str, details: Any = None):
    """Log a general scan lifecycle event."""
    if settings.LOGFIRE_TOKEN:
        logfire.info(
            "Scan event: {event}",
            scan_id=scan_id,
            event=event,
            details=str(details) if details else "",
        )
    else:
        # Fallback to print for debugging when Logfire isn't configured
        print(f"  [{event}] {details if details else ''}")
