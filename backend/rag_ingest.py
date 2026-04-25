"""
RAG Ingestion Pipeline - Gemini Embeddings + ChromaDB
Usage: python rag_ingest.py --source ./documents
"""

import argparse
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
CHROMA_PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")
COLLECTION_NAME = "market_intelligence"


def load_documents(source_path: str) -> list:
    path = Path(source_path)
    docs = []
    if path.is_dir():
        print(f"Loading directory: {source_path}")
        for glob, cls in [("**/*.pdf", PyPDFLoader), ("**/*.txt", TextLoader)]:
            try:
                loader = DirectoryLoader(source_path, glob=glob, loader_cls=cls, show_progress=True)
                docs.extend(loader.load())
            except Exception as e:
                print(f"  Warning: {e}")
    elif path.suffix.lower() == ".pdf":
        docs = PyPDFLoader(source_path).load()
    elif path.suffix.lower() in (".txt", ".text"):
        docs = TextLoader(source_path).load()
    print(f"Loaded {len(docs)} document pages.")
    return docs


def ingest(source_path: str):
    docs = load_documents(source_path)
    if not docs:
        print("No documents found.")
        return
    chunks = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP).split_documents(docs)
    print(f"Created {len(chunks)} chunks. Embedding with Gemini...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=os.environ.get("GEMINI_API_KEY"))
    vectorstore = Chroma(collection_name=COLLECTION_NAME, embedding_function=embeddings, persist_directory=CHROMA_PERSIST_DIR)
    for i in range(0, len(chunks), 50):
        vectorstore.add_documents(chunks[i:i+50])
        print(f"  Stored batch {i//50 + 1}")
    print(f"Done! {len(chunks)} chunks stored.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    args = parser.parse_args()
    ingest(args.source)
