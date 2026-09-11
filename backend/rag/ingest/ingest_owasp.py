"""
AURA - OWASP LLM Top 10 Ingestion
"""

import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")

# Set env vars explicitly so langchain_pinecone can read them
from config.settings import settings
os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

PDF_PATH = Path(__file__).parent.parent.parent / "data" / "OWASP-Top-10-for-LLMs-2023-v1_1.pdf"


def get_or_create_index(pc: Pinecone):
    existing = [i.name for i in pc.list_indexes()]
    if settings.PINECONE_INDEX_NAME not in existing:
        print(f"Creating index: {settings.PINECONE_INDEX_NAME}")
        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print("Index created!")
    else:
        print(f"Index '{settings.PINECONE_INDEX_NAME}' already exists.")


def ingest_owasp():
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        return

    print(f"Loading PDF: {PDF_PATH.name}")
    loader = PyPDFLoader(str(PDF_PATH))
    docs = loader.load()
    print(f"  Loaded {len(docs)} pages")

    for doc in docs:
        doc.metadata["source"] = "owasp_llm_top10"
        doc.metadata["type"] = "vulnerability_guide"
        doc.metadata["category"] = "owasp"

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    print(f"  Split into {len(chunks)} chunks")

    print("Connecting to Pinecone...")
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    get_or_create_index(pc)

    print("Embedding and uploading to Pinecone...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=settings.PINECONE_INDEX_NAME,
        namespace="owasp",
    )

    print(f"Done! Uploaded {len(chunks)} chunks to Pinecone namespace 'owasp'")
    return len(chunks)


if __name__ == "__main__":
    ingest_owasp()
