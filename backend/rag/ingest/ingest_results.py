"""
AURA - Attack Results Ingestion (Self-Learning)
After each scan, stores successful attack results back into Pinecone
so future scans can learn from past results.

Usage: Called automatically by the Evaluator Agent after scoring.
"""

from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

from config.settings import settings


def ingest_attack_result(attack_result: dict, eval_score: dict):
    """
    Store a successful attack result in Pinecone for future scans to learn from.
    Only stores SUCCESSFUL attacks (success_rate > 0).
    """

    if not eval_score.get("success", False):
        return  # Only store successful attacks

    # Build rich text for embedding
    content = (
        f"Successful attack against {attack_result.get('target_url', 'unknown target')}.\n"
        f"Attack Type: {attack_result.get('attack_type', '')}\n"
        f"Category: {attack_result.get('category', '')}\n"
        f"Payload: {attack_result.get('payload', '')[:300]}\n"
        f"Model Used: {attack_result.get('model_used', '')}\n"
        f"CVSS Score: {eval_score.get('cvss_score', 0)}\n"
        f"Severity: {eval_score.get('severity', '')}\n"
        f"Harmfulness: {eval_score.get('harmfulness_score', 0)}\n"
    )

    doc = Document(
        page_content=content,
        metadata={
            "source": "attack_results",
            "type": "successful_attack",
            "attack_type": attack_result.get("attack_type", ""),
            "category": attack_result.get("category", ""),
            "severity": eval_score.get("severity", ""),
            "cvss_score": str(eval_score.get("cvss_score", 0)),
            "scan_id": attack_result.get("scan_id", ""),
            "timestamp": attack_result.get("timestamp", ""),
        }
    )

    # Connect to Pinecone and store
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    embeddings = OpenAIEmbeddings(
        api_key=settings.OPENAI_API_KEY,
        model="text-embedding-3-small",
    )

    vectorstore = PineconeVectorStore(
        index_name=settings.PINECONE_INDEX_NAME,
        embedding=embeddings,
        namespace="attack_results",
        pinecone_api_key=settings.PINECONE_API_KEY,
    )
    vectorstore.add_documents([doc])


def ingest_bulk_results(attack_results: list[dict], eval_scores: list[dict]):
    """
    Store multiple attack results at once after a scan completes.
    Matches results to scores by attack_id.
    """

    score_map = {s.get("attack_id"): s for s in eval_scores}
    successful = []

    for result in attack_results:
        score = score_map.get(result.get("attack_id", ""))
        if score and score.get("success"):
            content = (
                f"Successful attack.\n"
                f"Attack Type: {result.get('attack_type', '')}\n"
                f"Category: {result.get('category', '')}\n"
                f"Payload: {result.get('payload', '')[:300]}\n"
                f"CVSS Score: {score.get('cvss_score', 0)}\n"
                f"Severity: {score.get('severity', '')}\n"
            )
            successful.append(Document(
                page_content=content,
                metadata={
                    "source": "attack_results",
                    "type": "successful_attack",
                    "attack_type": result.get("attack_type", ""),
                    "category": result.get("category", ""),
                    "severity": score.get("severity", ""),
                    "cvss_score": str(score.get("cvss_score", 0)),
                }
            ))

    if not successful:
        print("No successful attacks to store.")
        return 0

    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    embeddings = OpenAIEmbeddings(
        api_key=settings.OPENAI_API_KEY,
        model="text-embedding-3-small",
    )
    vectorstore = PineconeVectorStore(
        index_name=settings.PINECONE_INDEX_NAME,
        embedding=embeddings,
        namespace="attack_results",
        pinecone_api_key=settings.PINECONE_API_KEY,
    )
    vectorstore.add_documents(successful)
    print(f"Stored {len(successful)} successful attack results in Pinecone.")
    return len(successful)
