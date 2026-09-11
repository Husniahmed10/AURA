"""
AURA - Attack Strategy Retriever
Queries Pinecone to find the best attack strategies based on recon findings.
Uses RAG to intelligently select attacks suited to the target.
"""

from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

from orchestrator.state import ReconData
from config.settings import settings


def build_query_from_recon(recon_data: dict) -> str:
    """
    Build a semantic query from recon findings to retrieve relevant attacks.
    """
    parts = []

    model = recon_data.get("model_type", "unknown")
    if model != "unknown":
        parts.append(f"attacks effective against {model}")

    guardrails = recon_data.get("guardrails_detected", [])
    if "keyword_filter" in guardrails:
        parts.append("bypass keyword filter content moderation")
    if "llm_safety_training" in guardrails:
        parts.append("jailbreak safety training bypass roleplay")

    attack_surface = recon_data.get("attack_surface", [])
    if "weak_injection_defense" in attack_surface:
        parts.append("prompt injection ignore instructions")
    if "system_prompt_leak" in attack_surface:
        parts.append("system prompt extraction confidential data theft")

    blocked = recon_data.get("blocked_topics", [])
    if blocked:
        parts.append(f"bypass blocks for topics: {', '.join(blocked)}")

    if not parts:
        parts.append("general LLM jailbreak attack prompt injection")

    return " | ".join(parts)


def get_attack_strategies(recon_data: dict, top_k: int = None) -> list[dict]:
    """
    Query Pinecone to retrieve the most relevant attack strategies
    based on recon findings.

    Args:
        recon_data: ReconData as dict from the Recon Agent
        top_k: Number of strategies to retrieve

    Returns:
        List of attack strategy dicts with content and metadata
    """
    if top_k is None:
        top_k = settings.PINECONE_TOP_K

    query = build_query_from_recon(recon_data)
    print(f"  RAG query: {query[:100]}...")

    embeddings = OpenAIEmbeddings(
        api_key=settings.OPENAI_API_KEY,
        model="text-embedding-3-small",
    )

    strategies = []

    # Query each namespace
    namespaces = ["jailbreaks", "owasp", "attack_results"]

    for namespace in namespaces:
        try:
            vectorstore = PineconeVectorStore(
                index_name=settings.PINECONE_INDEX_NAME,
                embedding=embeddings,
                namespace=namespace,
                pinecone_api_key=settings.PINECONE_API_KEY,
            )

            results = vectorstore.similarity_search_with_score(
                query,
                k=top_k,
            )

            for doc, score in results:
                strategies.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "relevance_score": round(float(score), 4),
                    "namespace": namespace,
                })

        except Exception as e:
            print(f"  Warning: Could not query namespace '{namespace}': {e}")
            continue

    # Sort by relevance score
    strategies.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Deduplicate by content
    seen = set()
    unique_strategies = []
    for s in strategies:
        key = s["content"][:100]
        if key not in seen:
            seen.add(key)
            unique_strategies.append(s)

    print(f"  Retrieved {len(unique_strategies)} unique attack strategies from Pinecone")
    return unique_strategies[:top_k * 2]  # Return top 2x for variety
