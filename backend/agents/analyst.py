"""
Analyst Agent - Groq (Llama3-70b)
Produces SWOT analysis, financial insights, and can request more research.
"""

import asyncio
import json
import os
import re
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

ANALYST_SYSTEM_PROMPT = """You are a Senior Financial & Strategy Analyst at a top-tier investment firm.

Analyze the research findings and produce structured analysis.

OUTPUT FORMAT - respond ONLY with valid JSON, no markdown fences:
{
  "needs_more_research": false,
  "clarification_query": null,
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
  "confidence_score": 0.85,
  "data_gaps": ["..."]
}

RULES:
- If confidence_score < 0.6, set needs_more_research=true with a specific clarification_query.
- Only include sourced metrics. Be decisive and actionable.
- Return ONLY the JSON object, absolutely no extra text or markdown.
"""


class AnalystAgent:
    def __init__(self, event_queue: asyncio.Queue):
        self.q = event_queue
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.environ.get("GROQ_API_KEY"),
            temperature=0.2,
        )

    async def emit(self, message: str, level: str = "info"):
        await self.q.put({"type": "agent_log", "agent": "analyst", "message": message, "level": level})

    async def run(self, query: str, research_results: list) -> dict:
        await self.emit(f"Analyzing {len(research_results)} research findings...")
        findings_text = "\n".join(
            f"- [{r.get('confidence','?')}] {r.get('finding','')} (Source: {r.get('source','')})"
            for r in research_results
        )
        messages = [
            SystemMessage(content=ANALYST_SYSTEM_PROMPT),
            HumanMessage(content=f"Company/Topic: {query}\n\nResearch Findings:\n{findings_text}\n\nReturn JSON only, no extra text."),
        ]
        await self.emit("Running SWOT and financial analysis with Groq Llama3...")
        response = await asyncio.get_event_loop().run_in_executor(None, lambda: self.llm.invoke(messages))

        text = re.sub(r"```json|```", "", response.content).strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
                confidence = result.get("confidence_score", 1.0)
                await self.emit(f"Analysis complete. Confidence: {confidence:.0%}", "success" if confidence >= 0.6 else "warning")
                return result
            except json.JSONDecodeError:
                pass

        await self.emit("Could not parse analysis; using fallback.", "warning")
        return {
            "needs_more_research": False,
            "swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []},
            "financial_insights": {"key_metrics": [], "growth_drivers": [], "risk_factors": []},
            "market_trends": [],
            "confidence_score": 0.4,
            "data_gaps": ["Parsing failed"],
            "raw": text,
        }
