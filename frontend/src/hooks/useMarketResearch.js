/**
 * useMarketResearch.js
 * Hook to connect to the FastAPI backend via SSE
 */

import { useState, useRef, useCallback } from "react";

const API_URL = "";  // Empty = uses Vite proxy to localhost:8000

export function useMarketResearch() {
  const [phase, setPhase] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const handleEvent = useCallback((event) => {
    if (event.type === "agent_log") {
      setLogs((prev) => [...prev, event]);
      setActiveAgent(event.agent);
    } else if (event.type === "done") {
      setReport(event.data);
      setPhase("done");
      setActiveAgent(null);
      eventSourceRef.current?.close();
    } else if (event.type === "error") {
      setError(event.data);
      setPhase("error");
      setActiveAgent(null);
      eventSourceRef.current?.close();
    }
  }, []);

  const start = useCallback(async (query, options = {}) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setPhase("running");
    setLogs([]);
    setReport(null);
    setError(null);
    setActiveAgent(null);

    try {
      const res = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, use_rag: options.useRag ?? true, depth: options.depth ?? "standard" }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const { job_id } = await res.json();

      const es = new EventSource(`${API_URL}/api/research/${job_id}/stream`);
      eventSourceRef.current = es;
      es.onmessage = (e) => {
        try { handleEvent(JSON.parse(e.data)); } catch {}
      };
      es.onerror = () => {
        es.close();
        setPhase("error");
        setError("Connection to agent stream lost.");
        setActiveAgent(null);
      };
    } catch (err) {
      setPhase("error");
      setError(err.message);
    }
  }, [handleEvent]);

  const reset = useCallback(() => {
    eventSourceRef.current?.close();
    setPhase("idle");
    setLogs([]);
    setReport(null);
    setError(null);
    setActiveAgent(null);
  }, []);

  return { phase, logs, activeAgent, report, error, start, reset };
}
