"""
Researcher Agent - Groq (Llama3-70b) + Tavily Search + ChromaDB RAG
"""

import asyncio
import os
import re
import json
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_chroma import Chroma

RESEARCHER_SYSTEM_PROMPT = """You are a Senior Market Research Analyst with access to two tools:
1. vector_db_search - searches a curated knowledge base of financial reports and industry analyses.
2. web_search - performs live web searches for recent news and market data.

STRICT RULES:
- Every factual claim MUST be directly attributed to a source.
- If no relevant data is found, state: "No source found for [claim]." Do NOT invent data.
- NEVER produce financial figures or market share percentages without citing a source.
- Format each finding as: {"finding": "...", "source": "...", "confidence": "high|medium|low"}

Your output must be a JSON array of findings. No prose outside the JSON.
"""


class ResearcherAgent:
    def __init__(self, event_queue: asyncio.Queue):
        self.q = event_queue
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.environ.get("GROQ_API_KEY"),
            temperature=0.1,
        )
        self._init_tools()

    def _init_tools(self):
        self.search_tool = TavilySearchResults(
            max_results=5,
            tavily_api_key=os.environ.get("TAVILY_API_KEY", ""),
        )
        try:
            embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=os.environ.get("GEMINI_API_KEY", ""),
            )
            self.vector_store = Chroma(
                collection_name="market_intelligence",
                embedding_function=embeddings,
                persist_directory=os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db"),
            )
            self.rag_available = True
        except Exception:
            self.rag_available = False

    async def emit(self, message: str, level: str = "info"):
        await self.q.put({"type": "agent_log", "agent": "researcher", "message": message, "level": level})

    async def _rag_search(self, query: str) -> list:
        if not self.rag_available:
            return []
        try:
            docs = self.vector_store.similarity_search(query, k=5)
            return [{"content": doc.page_content, "source": doc.metadata.get("source", "internal_kb"), "type": "rag"} for doc in docs]
        except Exception as e:
            await self.emit(f"RAG search failed: {e}", "warning")
            return []

    async def _web_search(self, query: str) -> list:
        try:
            await self.emit(f"Searching web: '{query}'")
            results = await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.search_tool.invoke(query)
            )
            return [{"content": r.get("content", ""), "source": r.get("url", "web"), "title": r.get("title", ""), "type": "web"} for r in results]
        except Exception as e:
            await self.emit(f"Web search failed: {e}", "warning")
            return []

    async def run(self, query: str, use_rag: bool = True, previous_results=None) -> list:
        await self.emit(f"Starting research for: '{query}'")
        tasks = []
        if use_rag:
            await self.emit("Querying vector knowledge base (RAG)...")
            tasks.append(self._rag_search(query))
        await self.emit("Querying live web sources via Tavily...")
        tasks.append(self._web_search(query))
        tasks.append(self._web_search(f"{query} financial analysis market share 2024"))
        tasks.append(self._web_search(f"{query} competitors SWOT industry trends"))

        raw_results = []
        for result in await asyncio.gather(*tasks, return_exceptions=True):
            if isinstance(result, list):
                raw_results.extend(result)

        await self.emit(f"Gathered {len(raw_results)} raw sources. Synthesizing with Groq Llama3...")

        context_text = "\n\n".join(
            f"[Source: {r['source']}]\n{r['content'][:800]}" for r in raw_results[:12]
        )
        messages = [
            SystemMessage(content=RESEARCHER_SYSTEM_PROMPT),
            HumanMessage(content=f"Research topic: {query}\n\nSource data:\n{context_text}\n\nReturn a JSON array of findings only."),
        ]
        response = await asyncio.get_event_loop().run_in_executor(None, lambda: self.llm.invoke(messages))
        await self.emit("Research synthesis complete.", "success")

        text = re.sub(r"```json|```", "", response.content).strip()
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return [{"finding": text, "source": "llm_synthesis", "confidence": "medium"}]
