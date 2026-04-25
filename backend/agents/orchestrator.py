"""
Multi-Agent Orchestrator - LangGraph-style stateful workflow
Researcher -> Analyst -> Compiler with feedback loop
"""

import asyncio
from dataclasses import dataclass, field
from enum import Enum

from agents.researcher import ResearcherAgent
from agents.analyst import AnalystAgent
from agents.compiler import CompilerAgent


class WorkflowState(str, Enum):
    INIT = "init"
    RESEARCHING = "researching"
    ANALYZING = "analyzing"
    NEEDS_MORE_RESEARCH = "needs_more_research"
    COMPILING = "compiling"
    DONE = "done"
    FAILED = "failed"


@dataclass
class AgentState:
    query: str
    research_results: list = field(default_factory=list)
    analysis: dict = field(default_factory=dict)
    final_report: dict = field(default_factory=dict)
    iteration: int = 0
    max_iterations: int = 3
    state: WorkflowState = WorkflowState.INIT
    clarification_request: str = None


class MarketIntelligenceOrchestrator:
    def __init__(self, job_id: str, event_queue: asyncio.Queue):
        self.job_id = job_id
        self.q = event_queue
        self.researcher = ResearcherAgent(event_queue=event_queue)
        self.analyst = AnalystAgent(event_queue=event_queue)
        self.compiler = CompilerAgent(event_queue=event_queue)

    async def emit(self, agent: str, message: str, level: str = "info"):
        await self.q.put({"type": "agent_log", "agent": agent, "message": message, "level": level})

    async def run(self, query: str, use_rag: bool = True, depth: str = "standard") -> dict:
        state = AgentState(query=query)
        await self.emit("orchestrator", f"Starting market intelligence pipeline for: '{query}'")

        while state.state not in (WorkflowState.DONE, WorkflowState.FAILED):

            if state.state in (WorkflowState.INIT, WorkflowState.NEEDS_MORE_RESEARCH):
                state.state = WorkflowState.RESEARCHING
                refined_query = state.clarification_request or query
                await self.emit("orchestrator", f"Routing to Researcher (iteration {state.iteration + 1})")
                research_data = await self.researcher.run(
                    query=refined_query, use_rag=use_rag, previous_results=state.research_results
                )
                state.research_results.extend(research_data)
                state.iteration += 1
                await self.emit("orchestrator", f"Researcher returned {len(research_data)} data points. Routing to Analyst.")
                state.state = WorkflowState.ANALYZING

            elif state.state == WorkflowState.ANALYZING:
                analysis_result = await self.analyst.run(query=query, research_results=state.research_results)
                if analysis_result.get("needs_more_research") and state.iteration < state.max_iterations:
                    state.clarification_request = analysis_result.get("clarification_query", query + " detailed financials")
                    await self.emit("analyst", f"Requesting more research: '{state.clarification_request}'", "warning")
                    state.state = WorkflowState.NEEDS_MORE_RESEARCH
                else:
                    state.analysis = analysis_result
                    await self.emit("orchestrator", "Analysis complete. Routing to Compiler.")
                    state.state = WorkflowState.COMPILING

            elif state.state == WorkflowState.COMPILING:
                final_report = await self.compiler.run(
                    query=query, research_results=state.research_results, analysis=state.analysis
                )
                state.final_report = final_report
                state.state = WorkflowState.DONE
                await self.emit("orchestrator", "Pipeline complete. Report ready.", "success")

        return state.final_report
