"""
AURA - Portkey LLM Gateway
Routes all LLM calls through Portkey for:
- Fallback: Groq (primary) -> OpenAI (fallback)
- Observability: all LLM calls logged in Portkey dashboard
- Cost tracking: per-model token usage
"""

from portkey_ai import Portkey
from langchain_openai import ChatOpenAI

from config.settings import settings


def get_portkey_client() -> Portkey:
    """
    Get a Portkey client that routes through the configured fallback chain.
    Groq (primary) -> OpenAI GPT-4o (fallback)
    """
    return Portkey(
        api_key=settings.PORTKEY_API_KEY,
        config=settings.PORTKEY_CONFIG_ID,
    )


def get_llm_via_portkey(
    task: str = "attack",
    temperature: float = 0.7,
    max_tokens: int = 1000,
) -> ChatOpenAI:
    """
    Get a LangChain-compatible LLM routed through Portkey.

    Args:
        task: One of "attack", "recon", "report", "eval"
              Used to set the right model and temperature.
        temperature: Sampling temperature
        max_tokens: Max tokens in response

    Returns:
        LangChain ChatOpenAI instance routed via Portkey
    """
    # Task-specific settings
    task_config = {
        "recon":  {"temperature": 0.3, "max_tokens": 500},
        "attack": {"temperature": 0.9, "max_tokens": 800},
        "eval":   {"temperature": 0.1, "max_tokens": 500},
        "report": {"temperature": 0.4, "max_tokens": 2000},
    }

    config = task_config.get(task, {"temperature": temperature, "max_tokens": max_tokens})

    # Use Portkey as OpenAI-compatible base URL
    return ChatOpenAI(
        api_key=settings.PORTKEY_API_KEY,
        base_url="https://api.portkey.ai/v1",
        model=settings.ATTACK_MODEL,   # Portkey config overrides this with routing
        temperature=config["temperature"],
        max_tokens=config["max_tokens"],
        default_headers={
            "x-portkey-api-key": settings.PORTKEY_API_KEY,
            "x-portkey-config": settings.PORTKEY_CONFIG_ID,
        },
    )


def get_direct_groq_llm(temperature: float = 0.7) -> ChatOpenAI:
    """
    Fallback: direct Groq without Portkey (for when Portkey is not configured).
    """
    from langchain_groq import ChatGroq
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.ATTACK_MODEL,
        temperature=temperature,
    )


def get_llm(task: str = "attack", temperature: float = 0.7):
    """
    Smart LLM getter:
    - If Portkey is configured -> use Portkey (Groq + fallback to OpenAI)
    - If not configured -> use Groq directly
    """
    if settings.PORTKEY_API_KEY and settings.PORTKEY_CONFIG_ID:
        return get_llm_via_portkey(task=task, temperature=temperature)
    else:
        print(f"  [Portkey not configured] Using Groq directly for task: {task}")
        return get_direct_groq_llm(temperature=temperature)
