"""
AURA - Jailbreak Templates Ingestion
"""

import os
import json
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")

from config.settings import settings
os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

JSON_PATH = Path(__file__).parent.parent / "knowledge_base" / "known_jailbreaks.json"


def get_or_create_index(pc: Pinecone):
    existing = [i.name for i in pc.list_indexes()]
    if settings.PINECONE_INDEX_NAME not in existing:
        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
    else:
        print(f"Index '{settings.PINECONE_INDEX_NAME}' already exists.")


def ingest_jailbreaks():
    if not JSON_PATH.exists():
        print(f"ERROR: File not found at {JSON_PATH}")
        return

    print(f"Loading jailbreaks from: {JSON_PATH.name}")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        jailbreaks = json.load(f)
    print(f"  Loaded {len(jailbreaks)} jailbreak templates")

    docs = []
    for jb in jailbreaks:
        content = (
            f"Attack Name: {jb.get('name', '')}\n"
            f"Category: {jb.get('category', '')}\n"
            f"Description: {jb.get('description', '')}\n"
            f"Target Models: {', '.join(jb.get('target_models', []))}\n"
            f"Success Rate: {jb.get('success_rate', 0)}\n"
            f"Prompt: {jb.get('prompt', '') or str(jb.get('prompt_sequence', ''))}"
        )
        docs.append(Document(
            page_content=content,
            metadata={
                "source": "known_jailbreaks",
                "type": "jailbreak_template",
                "name": jb.get("name", ""),
                "category": jb.get("category", ""),
                "success_rate": str(jb.get("success_rate", 0)),
                "target_models": ",".join(jb.get("target_models", [])),
            }
        ))

    print("Connecting to Pinecone...")
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    get_or_create_index(pc)

    print("Embedding and uploading to Pinecone...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    PineconeVectorStore.from_documents(
        documents=docs,
        embedding=embeddings,
        index_name=settings.PINECONE_INDEX_NAME,
        namespace="jailbreaks",
    )

    print(f"Done! Uploaded {len(docs)} jailbreak templates to namespace 'jailbreaks'")
    return len(docs)


if __name__ == "__main__":
    ingest_jailbreaks()
