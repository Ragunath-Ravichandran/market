import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { useMarketResearch } from "./hooks/useMarketResearch";

const COLORS = {
  bg: "#0A0C10", surface: "#111318", border: "#1E2230",
  accent: "#00D4FF", green: "#00E5A0", red: "#FF4560",
  gold: "#F5A623", muted: "#4A5568", text: "#E2E8F0", textDim: "#718096",
};

const AGENT_CONFIG = {
  researcher:   { label: "Researcher",   icon: "🔍", color: "#00D4FF", desc: "Querying knowledge bases & live web" },
  analyst:      { label: "Analyst",      icon: "📊", color: "#F5A623", desc: "Running SWOT & financial analysis" },
  compiler:     { label: "Compiler",     icon: "📋", color: "#00E5A0", desc: "Generating structured report" },
  orchestrator: { label: "Orchestrator", icon: "⚙️", color: "#A78BFA", desc: "Coordinating agent workflow" },
};

const SUGGESTIONS = ["Apple Inc", "Tesla Motors", "OpenAI", "EV Battery Market", "Semiconductor Industry", "Meta Platforms"];

function AgentPulse({ agent, isActive }) {
  const cfg = AGENT_CONFIG[agent] || AGENT_CONFIG.orchestrator;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background: isActive ? `${cfg.color}15` : "transparent", border:`1px solid ${isActive ? cfg.color : COLORS.border}`, borderRadius:8, transition:"all 0.3s", opacity: isActive ? 1 : 0.4 }}>
      <div style={{ position:"relative" }}>
        <span style={{ fontSize:18 }}>{cfg.icon}</span>
        {isActive && <div style={{ position:"absolute", top:-3, right:-3, width:8, height:8, borderRadius:"50%", background:cfg.color, boxShadow:`0 0 6px ${cfg.color}`, animation:"pulse 1.2s infinite" }} />}
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color: isActive ? cfg.color : COLORS.textDim, fontFamily:"monospace" }}>{cfg.label}</div>
        <div style={{ fontSize:11, color:COLORS.textDim }}>{isActive ? cfg.desc : "Idle"}</div>
      </div>
    </div>
  );
}

function LogEntry({ event }) {
  const cfg = AGENT_CONFIG[event.agent] || AGENT_CONFIG.orchestrator;
  const levelColors = { info:COLORS.textDim, success:COLORS.green, warning:COLORS.gold, error:COLORS.red };
  return (
    <div style={{ display:"flex", gap:10, padding:"6px 0", borderBottom:`1px solid ${COLORS.border}`, animation:"slideIn 0.2s ease" }}>
      <span style={{ fontSize:11, color:cfg.color, fontFamily:"monospace", minWidth:84, fontWeight:700 }}>[{cfg.label}]</span>
      <span style={{ fontSize:11, color:levelColors[event.level]||COLORS.text, fontFamily:"monospace", lineHeight:1.5 }}>{event.message}</span>
    </div>
  );
}

function SWOTCard({ swot }) {
  const sections = [
    { key:"strengths",    label:"Strengths",     color:COLORS.green, icon:"↑" },
    { key:"weaknesses",   label:"Weaknesses",    color:COLORS.red,   icon:"↓" },
    { key:"opportunities",label:"Opportunities", color:COLORS.accent,icon:"◆" },
    { key:"threats",      label:"Threats",       color:COLORS.gold,  icon:"⚠" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
      {sections.map(({ key, label, color, icon }) => (
        <div key={key} style={{ background:COLORS.surface, border:`1px solid ${color}40`, borderRadius:10, padding:16, borderTop:`3px solid ${color}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ color, fontSize:16, fontWeight:900 }}>{icon}</span>
            <span style={{ color, fontSize:13, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
          </div>
          <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:8 }}>
            {(swot[key]||[]).map((item,i) => (
              <li key={i} style={{ display:"flex", gap:8, fontSize:12, color:COLORS.text, lineHeight:1.5 }}>
                <span style={{ color, flexShrink:0, marginTop:1 }}>•</span>{item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MetricBadge({ metric, value, source }) {
  return (
    <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"12px 16px", display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ fontSize:11, color:COLORS.textDim, textTransform:"uppercase", letterSpacing:"0.08em" }}>{metric}</div>
      <div style={{ fontSize:22, fontWeight:800, color:COLORS.accent, fontFamily:"monospace" }}>{value}</div>
      <div style={{ fontSize:10, color:COLORS.muted }}>via {source}</div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("swot");
  const logsEndRef = useRef(null);
  const { phase, logs, activeAgent, report, error, start, reset } = useMarketResearch();

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [logs]);

  const handleSubmit = () => { if (query.trim()) start(query, { useRag: true }); };
  const handleReset = () => { reset(); setQuery(""); };
  const confidencePct = report ? Math.round((report.report_meta?.confidence || 0) * 100) : 0;

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, color:COLORS.text, fontFamily:"'IBM Plex Mono','Courier New',monospace", padding:0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;700&family=Space+Grotesk:wght@400;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:${COLORS.bg}; } ::-webkit-scrollbar-thumb { background:${COLORS.border}; border-radius:2px; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${COLORS.border}`, background:`${COLORS.surface}CC`, backdropFilter:"blur(10px)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:`linear-gradient(135deg,${COLORS.accent},#7C3AED)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⬡</div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, letterSpacing:"-0.02em", fontFamily:"'Space Grotesk',sans-serif" }}>MARKET INTEL</div>
            <div style={{ fontSize:10, color:COLORS.textDim, letterSpacing:"0.15em" }}>AGENTIC INTELLIGENCE SUITE v1.0</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {["researcher","analyst","compiler"].map(agent => (
            <div key={agent} style={{ width:8, height:8, borderRadius:"50%", background: activeAgent===agent ? AGENT_CONFIG[agent].color : COLORS.muted, boxShadow: activeAgent===agent ? `0 0 8px ${AGENT_CONFIG[agent].color}` : "none", transition:"all 0.3s" }} />
          ))}
          <span style={{ fontSize:10, color:COLORS.textDim, marginLeft:4, letterSpacing:"0.1em" }}>
            {phase==="running" ? "RUNNING" : phase==="done" ? "COMPLETE" : phase==="error" ? "ERROR" : "STANDBY"}
          </span>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"32px 24px", display:"flex", flexDirection:"column", gap:24 }}>

        {/* Search — idle state */}
        {phase === "idle" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:32, padding:"60px 0" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:42, fontWeight:800, letterSpacing:"-0.04em", fontFamily:"'Space Grotesk',sans-serif", background:`linear-gradient(90deg,${COLORS.accent},#A78BFA,${COLORS.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:12 }}>
                Market Intelligence
              </div>
              <div style={{ fontSize:14, color:COLORS.textDim, maxWidth:480 }}>
                Multi-agent AI system powered by Gemini + Tavily live search.<br/>Enter a company or industry to generate a full intelligence report.
              </div>
            </div>
            <div style={{ display:"flex", gap:12, width:"100%", maxWidth:600 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSubmit()}
                placeholder="e.g. Apple Inc, EV battery market, OpenAI..."
                style={{ flex:1, padding:"14px 20px", background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:10, color:COLORS.text, fontSize:14, fontFamily:"inherit", outline:"none" }}
                onFocus={e => e.target.style.borderColor=COLORS.accent}
                onBlur={e => e.target.style.borderColor=COLORS.border}
              />
              <button onClick={handleSubmit} disabled={!query.trim()}
                style={{ padding:"14px 28px", background: query.trim() ? `linear-gradient(135deg,${COLORS.accent}CC,#7C3AED)` : COLORS.border, border:"none", borderRadius:10, color: query.trim() ? "#000" : COLORS.textDim, fontWeight:700, fontSize:13, cursor: query.trim() ? "pointer" : "not-allowed", fontFamily:"inherit", letterSpacing:"0.05em" }}>
                ANALYZE →
              </button>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  style={{ padding:"6px 14px", background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:20, color:COLORS.textDim, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}
                  onMouseEnter={e => { e.target.style.borderColor=COLORS.accent; e.target.style.color=COLORS.accent; }}
                  onMouseLeave={e => { e.target.style.borderColor=COLORS.border; e.target.style.color=COLORS.textDim; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div style={{ background:`${COLORS.red}15`, border:`1px solid ${COLORS.red}`, borderRadius:12, padding:24, textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>⚠️</div>
            <div style={{ color:COLORS.red, fontWeight:700, marginBottom:8 }}>Pipeline Error</div>
            <div style={{ color:COLORS.textDim, fontSize:13, marginBottom:16 }}>{error}</div>
            <button onClick={handleReset} style={{ padding:"10px 24px", background:COLORS.red, border:"none", borderRadius:8, color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Try Again</button>
          </div>
        )}

        {/* Running / Done layout */}
        {(phase === "running" || phase === "done") && (
          <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:20, alignItems:"start" }}>

            {/* Left: Agent Feed */}
            <div style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:90 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, letterSpacing:"0.15em", color:COLORS.textDim }}>LIVE AGENT FEED</span>
                <button onClick={handleReset} style={{ fontSize:10, color:COLORS.textDim, background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:4, padding:"4px 8px", cursor:"pointer", fontFamily:"inherit" }}>↺ RESET</button>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {Object.keys(AGENT_CONFIG).map(agent => <AgentPulse key={agent} agent={agent} isActive={activeAgent===agent} />)}
              </div>

              <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:14 }}>
                <div style={{ fontSize:10, color:COLORS.textDim, marginBottom:6, letterSpacing:"0.1em" }}>ANALYZING</div>
                <div style={{ fontSize:13, color:COLORS.text, fontWeight:700 }}>"{query}"</div>
                <div style={{ marginTop:8, height:2, background:COLORS.border, borderRadius:2, overflow:"hidden" }}>
                  {phase==="running" && <div style={{ height:"100%", width:"60%", background:`linear-gradient(90deg,${COLORS.accent},#7C3AED)`, borderRadius:2, animation:"blink 2s infinite" }} />}
                  {phase==="done" && <div style={{ height:"100%", width:"100%", background:COLORS.green, borderRadius:2 }} />}
                </div>
              </div>

              <div style={{ background:"#080A0E", border:`1px solid ${COLORS.border}`, borderRadius:8, padding:14, maxHeight:380, overflowY:"auto" }}>
                <div style={{ fontSize:10, color:COLORS.textDim, marginBottom:8, letterSpacing:"0.1em" }}>CONSOLE OUTPUT</div>
                {logs.map((log,i) => <LogEntry key={i} event={log} />)}
                {phase==="running" && <span style={{ fontSize:11, color:COLORS.accent, animation:"blink 1s infinite" }}>▊</span>}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Right: Report */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {phase==="running" && !report && (
                <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:48, textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:16, animation:"pulse 2s infinite" }}>⬡</div>
                  <div style={{ fontSize:14, color:COLORS.textDim }}>Agents are working...</div>
                  <div style={{ fontSize:11, color:COLORS.muted, marginTop:8 }}>Researching sources, running analysis, compiling report</div>
                </div>
              )}

              {report && (
                <>
                  {/* Report header */}
                  <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:24, borderTop:`3px solid ${COLORS.accent}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                      <div>
                        <div style={{ fontSize:10, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:6 }}>INTELLIGENCE REPORT</div>
                        <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }}>{report.report_meta?.title}</div>
                      </div>
                      <div style={{ padding:"6px 14px", borderRadius:20, background:`${COLORS.green}20`, border:`1px solid ${COLORS.green}`, fontSize:12, color:COLORS.green, fontWeight:700 }}>
                        {confidencePct}% CONFIDENCE
                      </div>
                    </div>
                    <div style={{ marginTop:16, padding:16, background:`${COLORS.accent}08`, borderRadius:8, borderLeft:`3px solid ${COLORS.accent}`, fontSize:13, lineHeight:1.7 }}>
                      {report.executive_summary}
                    </div>
                  </div>

                  {/* Metrics */}
                  {report.financial_insights?.key_metrics?.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:12 }}>KEY METRICS</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
                        {report.financial_insights.key_metrics.map((m,i) => <MetricBadge key={i} {...m} />)}
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div style={{ display:"flex", gap:4, borderBottom:`1px solid ${COLORS.border}` }}>
                    {[{id:"swot",label:"SWOT"},{id:"trends",label:"Market Trends"},{id:"competitive",label:"Competitive"},{id:"recommendations",label:"Recommendations"}].map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{ padding:"10px 18px", background:"transparent", border:"none", borderBottom: activeTab===tab.id ? `2px solid ${COLORS.accent}` : "2px solid transparent", color: activeTab===tab.id ? COLORS.accent : COLORS.textDim, fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight: activeTab===tab.id ? 700 : 400, letterSpacing:"0.05em", marginBottom:-1 }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:24, animation:"slideIn 0.2s ease" }}>

                    {activeTab==="swot" && report.swot && (
                      <div>
                        <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:16 }}>SWOT ANALYSIS</div>
                        <SWOTCard swot={report.swot} />
                      </div>
                    )}

                    {activeTab==="trends" && (
                      <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                        <div>
                          <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:16 }}>GROWTH & SENTIMENT TREND</div>
                          <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={report.trend_chart_data||[]} margin={{ top:5,right:20,bottom:5,left:0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                              <XAxis dataKey="period" tick={{ fill:COLORS.textDim,fontSize:10 }} axisLine={{ stroke:COLORS.border }} />
                              <YAxis tick={{ fill:COLORS.textDim,fontSize:10 }} axisLine={{ stroke:COLORS.border }} />
                              <Tooltip contentStyle={{ background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:8,fontSize:12 }} />
                              <Line type="monotone" dataKey="growth_index" stroke={COLORS.accent} strokeWidth={2} dot={{ fill:COLORS.accent,r:3 }} name="Growth Index" />
                              <Line type="monotone" dataKey="mentions" stroke={COLORS.gold} strokeWidth={2} dot={{ fill:COLORS.gold,r:3 }} name="Mentions" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:12 }}>TREND SIGNALS</div>
                          {(report.market_trends||[]).map((t,i) => (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                              <span style={{ fontSize:12, color:COLORS.text, flex:1 }}>{t.trend}</span>
                              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background: t.impact==="high" ? `${COLORS.red}20` : t.impact==="medium" ? `${COLORS.gold}20` : `${COLORS.muted}20`, color: t.impact==="high" ? COLORS.red : t.impact==="medium" ? COLORS.gold : COLORS.muted, border:"1px solid currentColor", marginLeft:12 }}>{t.impact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab==="competitive" && report.competitive_landscape && (
                      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                        <div>
                          <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:8 }}>MARKET POSITION</div>
                          <div style={{ fontSize:16, color:COLORS.accent, fontWeight:700 }}>{report.competitive_landscape.position}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:12 }}>KEY COMPETITORS</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                            {(report.competitive_landscape.key_competitors||[]).map((c,i) => (
                              <div key={i} style={{ padding:"8px 16px", background:`${COLORS.gold}15`, border:`1px solid ${COLORS.gold}40`, borderRadius:8, fontSize:12, color:COLORS.gold }}>{c}</div>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize:13, color:COLORS.text, lineHeight:1.7, padding:16, background:`${COLORS.green}08`, borderRadius:8, borderLeft:`3px solid ${COLORS.green}` }}>
                          {report.competitive_landscape.differentiation}
                        </div>
                      </div>
                    )}

                    {activeTab==="recommendations" && (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:4 }}>STRATEGIC RECOMMENDATIONS</div>
                        {(report.recommendations||[]).map((r,i) => {
                          const pc = r.priority==="high" ? COLORS.red : r.priority==="medium" ? COLORS.gold : COLORS.accent;
                          return (
                            <div key={i} style={{ background:`${pc}08`, border:`1px solid ${pc}30`, borderLeft:`3px solid ${pc}`, borderRadius:8, padding:16, display:"flex", gap:16, alignItems:"flex-start" }}>
                              <div style={{ padding:"3px 10px", borderRadius:10, background:`${pc}20`, border:`1px solid ${pc}`, fontSize:10, color:pc, fontWeight:700, textTransform:"uppercase", flexShrink:0, marginTop:2 }}>{r.priority}</div>
                              <div>
                                <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{r.action}</div>
                                <div style={{ fontSize:12, color:COLORS.textDim, lineHeight:1.6 }}>{r.rationale}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sources */}
                  {report.sources_used?.length > 0 && (
                    <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:16 }}>
                      <div style={{ fontSize:10, color:COLORS.textDim, letterSpacing:"0.15em", marginBottom:10 }}>SOURCES USED</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                        {report.sources_used.map((s,i) => (
                          <div key={i} style={{ fontSize:11, color:COLORS.muted, padding:"4px 10px", background:`${COLORS.border}40`, borderRadius:4, border:`1px solid ${COLORS.border}` }}>{s}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
