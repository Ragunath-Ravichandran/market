"""
Agentic Market Intelligence Suite - FastAPI Backend
Streams real-time agent thinking logs via Server-Sent Events (SSE)
"""

import asyncio
import json
import uuid
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from agents.orchestrator import MarketIntelligenceOrchestrator

app = FastAPI(title="Market Intelligence Suite", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_store: dict[str, dict] = {}


class ResearchRequest(BaseModel):
    query: str
    use_rag: bool = True
    depth: str = "standard"


class JobResponse(BaseModel):
    job_id: str
    status: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research", response_model=JobResponse)
async def start_research(request: ResearchRequest):
    job_id = str(uuid.uuid4())
    job_store[job_id] = {
        "status": "pending",
        "query": request.query,
        "events": asyncio.Queue(),
        "result": None,
    }
    asyncio.create_task(
        run_orchestration(job_id, request.query, request.use_rag, request.depth)
    )
    return JobResponse(job_id=job_id, status="pending")


@app.get("/api/research/{job_id}/stream")
async def stream_research(job_id: str):
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return StreamingResponse(
        event_generator(job_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/research/{job_id}/status")
async def get_status(job_id: str):
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_store[job_id]
    return {"status": job["status"], "result": job.get("result")}


async def run_orchestration(job_id, query, use_rag, depth):
    queue = job_store[job_id]["events"]
    job_store[job_id]["status"] = "running"
    orchestrator = MarketIntelligenceOrchestrator(job_id=job_id, event_queue=queue)
    try:
        result = await orchestrator.run(query=query, use_rag=use_rag, depth=depth)
        job_store[job_id]["result"] = result
        job_store[job_id]["status"] = "completed"
        await queue.put({"type": "done", "data": result})
    except Exception as e:
        job_store[job_id]["status"] = "failed"
        await queue.put({"type": "error", "data": str(e)})


async def event_generator(job_id) -> AsyncGenerator[str, None]:
    queue = job_store[job_id]["events"]
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=120.0)
        except asyncio.TimeoutError:
            yield "event: heartbeat\ndata: {}\n\n"
            continue
        yield f"data: {json.dumps(event)}\n\n"
        if event.get("type") in ("done", "error"):
            break
