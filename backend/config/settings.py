"""
AURA - Application Settings
All configuration in one place using pydantic-settings.
Secrets from .env, everything else has sensible defaults.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AURA configuration - loaded from .env with defaults."""

    # -- LLM Providers --------------------------------------
    GROQ_API_KEY: str
    OPENAI_API_KEY: str = ""

    # -- LLM Model Routing ----------------------------------
    ATTACK_MODEL: str = "llama-3.1-70b-versatile"      # Groq - fast + free
    RECON_MODEL: str = "llama-3.1-8b-instant"           # Groq - ultra fast
    REPORT_MODEL: str = "gpt-4o"                        # OpenAI - best quality
    EVAL_MODEL: str = "llama-3.1-70b-versatile"         # Groq - good balance

    # -- Portkey LLM Gateway --------------------------------
    PORTKEY_API_KEY: str = ""

    # -- Pinecone Vector Database ---------------------------
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "aura-attacks"
    PINECONE_NAMESPACE: str = "attack_strategies"
    PINECONE_TOP_K: int = 5

    # -- Redis ----------------------------------------------
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_SCAN_TTL: int = 86400       # 24 hours
    REDIS_CACHE_TTL: int = 604800     # 7 days

    # -- Observability --------------------------------------
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "aura"
    LOGFIRE_TOKEN: str = ""

    # -- Agent Settings -------------------------------------
    MAX_ATTACKS: int = 200
    NUM_PROBES: int = 30
    PROBE_TIMEOUT: int = 10
    ATTACK_MAX_CONCURRENT: int = 5
    ATTACK_RETRY_ATTEMPTS: int = 3
    CVSS_THRESHOLD: float = 4.0
    SCAN_TIMEOUT: int = 300

    # -- Target Defaults ------------------------------------
    DEFAULT_SENSITIVITY: str = "HIGH"
    REPORT_FORMATS: list[str] = ["pdf", "json"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


# Singleton - import this everywhere
settings = Settings()
