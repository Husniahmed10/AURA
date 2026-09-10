from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM Providers
    GROQ_API_KEY: str
    OPENAI_API_KEY: str

    # LLM Model Routing
    ATTACK_MODEL: str = "openai/gpt-oss-120b"
    RECON_MODEL: str = "openai/gpt-oss-120b"
    REPORT_MODEL: str = "gpt-4o"
    EVAL_MODEL: str = "openai/gpt-oss-120b"

    # Portkey
    PORTKEY_API_KEY: str

    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "aura-attacks"
    PINECONE_NAMESPACE: str = "attack_strategies"
    PINECONE_TOP_K: int = 5

    # Redis
    REDIS_URL: str
    REDIS_SCAN_TTL: int = 86400   ## Scanned data
    REDIS_CACHE_TTL: int = 604800 ## Cached data

    # LangSmith
    LANGSMITH_TRACING: bool = True
    LANGSMITH_ENDPOINT: str = "https://eu.api.smith.langchain.com"
    LANGSMITH_API_KEY: str
    LANGSMITH_PROJECT: str = "AURA"

    # Logfire
    LOGFIRE_TOKEN: str

    # Agent Settings
    MAX_ATTACKS: int = 200          ## Maximum number of security attack/test attempts AURA can perform during a scan.
    NUM_PROBES: int = 30            ## Number of security probes/tests AURA performs. A probe is basically a test designed to check how the target responds.
    PROBE_TIMEOUT: int = 10         ## Maximum time allowed for one probe.
    ATTACK_MAX_CONCURRENT: int = 5  ## Maximum number of attacks that can run at the same time.
    ATTACK_RETRY_ATTEMPTS: int = 3  ## If an attack fails because of a temporary error, AURA can retry it.
    CVSS_THRESHOLD: float = 4.0     ## Only treat/report vulnerabilities with a CVSS score of 4.0 or higher as significant.
    SCAN_TIMEOUT: int = 300         ## Maximum amount of time allowed for the entire scan.

    # Target Defaults
    DEFAULT_SENSITIVITY: str = "HIGH"           ## tells AURA how strict/aggressive the security scan should be by default.
    REPORT_FORMATS: list[str] = ["pdf", "json"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()