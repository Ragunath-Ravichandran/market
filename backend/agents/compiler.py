"""
Compiler Agent - Groq (Llama3-70b)
Generates the final structured JSON intelligence report.
"""

import asyncio
import json
import os
import re
from datetime import datetime
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

COMPILER_SYSTEM_PROMPT = """You are a Chief Intelligence Officer compiling a final Market Intelligence Report.

OUTPUT FORMAT - respond ONLY with valid JSON, no markdown fences, no extra text:
{
  "report_meta": {
    "title": "Market Intelligence Report: [Topic]",
    "generated_at": "ISO timestamp",
    "query": "original query",
    "confidence": 0.0
  },
  "executive_summary": "2-3 sentence overview",
  "swot": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "threats": ["..."]
  },
  "financial_insights": {
    "revenue_trend": "growing|stable|declining|unknown",
    "market_position": "leader|challenger|niche|unknown",
    "key_metrics": [{"metric": "...", "value": "...", "source": "..."}],
    "growth_drivers": ["..."],
    "risk_factors": ["..."]
  },
  "market_trends": [
    {"trend": "...", "impact": "high|medium|low", "timeframe": "short|medium|long"}
  ],
  "competitive_landscape": {
    "position": "...",
    "key_competitors": ["..."],
    "differentiation": "..."
  },
  "recommendations": [
    {"priority": "high|medium|low", "action": "...", "rationale": "..."}
  ],
  "trend_chart_data": [
    {"period": "Q1 2023", "sentiment": 0.6, "mentions": 120, "growth_index": 45}
  ],
  "sources_used": ["..."]
}

Populate trend_chart_data with 6-8 quarterly data points. Return ONLY the JSON object.
"""


class CompilerAgent:
    def __init__(self, event_queue: asyncio.Queue):
        self.q = event_queue
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.environ.get("GROQ_API_KEY"),
            temperature=0.3,
        )

    async def emit(self, message: str, level: str = "info"):
        await self.q.put({"type": "agent_log", "agent": "compiler", "message": message, "level": level})

    async def run(self, query: str, research_results: list, analysis: dict) -> dict:
        await self.emit("Compiling final intelligence report with Groq Llama3...")
        sources = list({r.get("source", "") for r in research_results if r.get("source")})
        messages = [
            SystemMessage(content=COMPILER_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"Query: {query}\nTimestamp: {datetime.utcnow().isoformat()}\n\n"
                f"Analysis:\n{json.dumps(analysis, indent=2)}\n\n"
                f"Key Findings:\n" + "\n".join(f"- {r.get('finding','')[:200]}" for r in research_results[:10])
                + f"\n\nSources: {', '.join(sources[:15])}\n\nReturn ONLY the JSON report, no extra text."
            )),
        ]
        response = await asyncio.get_event_loop().run_in_executor(None, lambda: self.llm.invoke(messages))

        text = re.sub(r"```json|```", "", response.content).strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                report = json.loads(match.group())
                await self.emit("Final report compiled successfully.", "success")
                return report
            except json.JSONDecodeError:
                pass

        await self.emit("Returning raw output.", "warning")
        return {
            "report_meta": {"title": f"Market Intelligence: {query}", "generated_at": datetime.utcnow().isoformat(), "query": query, "confidence": 0.5},
            "executive_summary": text[:500],
            "raw_output": text,
        }
