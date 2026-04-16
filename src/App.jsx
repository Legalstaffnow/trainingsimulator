import { useState, useRef, useEffect } from "react";

const SCENARIOS = {
  "Intake Specialist": [
    { id: "angry_accident", label: "Angry Car Accident Client", desc: "Case type: Car accident. Personality: Angry. The client was hit last week and is frustrated with insurance companies." },
    { id: "emotional_client", label: "Emotional Client", desc: "Case type: Slip and fall. Personality: Distressed and emotional. Client is overwhelmed and unsure if they even have a case." },
    { id: "low_quality_lead", label: "Low-Quality Lead", desc: "Case type: Unclear. Personality: Vague and uncooperative. The caller is unsure what they want and gives minimal information." },
    { id: "uninsured_motorist", label: "Uninsured Motorist Claim", desc: "Case type: Car accident. Personality: Worried and confused. The at-fault driver had no insurance and the client doesn't know what options they have." },
    { id: "workers_comp", label: "Workers' Comp Inquiry", desc: "Case type: Workplace injury. Personality: Nervous and hesitant. The client is afraid of retaliation from their employer if they file a claim." },
    { id: "malpractice_call", label: "Medical Malpractice Call", desc: "Case type: Medical malpractice. Personality: Grief-stricken. The caller believes a family member died due to a surgical error and is calling for the first time." },
    { id: "drunk_driving", label: "Drunk Driving Victim", desc: "Case type: DUI accident. Personality: Angry and traumatized. The client was hit by a drunk driver and is still recovering from injuries." },
    { id: "slip_fall_store", label: "Slip and Fall in a Store", desc: "Case type: Premises liability. Personality: Embarrassed but in pain. The client slipped on a wet floor at a grocery store." },
    { id: "dog_bite", label: "Dog Bite Incident", desc: "Case type: Animal liability. Personality: Anxious and in pain. The caller was bitten by a neighbor's dog and doesn't want to cause problems." },
    { id: "statute_expiring", label: "Statute of Limitations Concern", desc: "Case type: Personal injury. Personality: Panicked. The caller just found out their filing deadline may be expiring soon." },
  ],
  "Legal Assistant": [
    { id: "angry_updates", label: "Angry Client Asking for Updates", desc: "Situation: Client is upset about lack of updates. Personality: Impatient and demanding." },
    { id: "scheduling_conflict", label: "Scheduling Conflict", desc: "Situation: Client needs to reschedule a deposition but the dates conflict with attorney availability." },
    { id: "confused_client", label: "Confused Client", desc: "Situation: Client doesn't understand the legal process and is calling with many questions. Personality: Confused and anxious." },
    { id: "billing_dispute", label: "Billing Dispute", desc: "Situation: Client received an invoice and is upset about unexpected fees. Personality: Accusatory and frustrated." },
    { id: "fire_attorney", label: "Client Wants to Fire the Attorney", desc: "Situation: Client is unhappy with case progress and demanding to discuss terminating representation. Personality: Hostile." },
    { id: "language_barrier", label: "Language Barrier Client", desc: "Situation: Client has limited English and is struggling to communicate an urgent update. Personality: Stressed and apologetic." },
    { id: "records_request", label: "Client Requesting Case File", desc: "Situation: Client is demanding a full copy of their case file immediately. Personality: Suspicious and impatient." },
    { id: "missed_appointment", label: "Client Missed Key Appointment", desc: "Situation: Client missed a mandatory medical evaluation. Personality: Defensive and making excuses. Reschedule urgently." },
    { id: "family_member", label: "Hostile Family Member Calling", desc: "Situation: A client's spouse is calling demanding case updates but is not authorized on the file. Personality: Aggressive." },
    { id: "negative_review", label: "Client Threatening Bad Review", desc: "Situation: A frustrated client is threatening a negative review online unless they get a call from the attorney today." },
  ],
  "Paralegal": [
    { id: "missed_deadline", label: "Missed Deadline Risk", desc: "Task: A filing deadline is approaching in 48 hours and the attorney is unavailable." },
    { id: "draft_update", label: "Draft Client Update Email", desc: "Task: Draft a client update email. Case is in discovery phase with delays." },
    { id: "case_summary", label: "Case Summary Task", desc: "Task: Supervising attorney needs a concise case summary for upcoming mediation." },
    { id: "deposition_prep", label: "Deposition Preparation", desc: "Task: Prepare a client for their upcoming deposition — process, dos and don'ts, key facts." },
    { id: "settlement_review", label: "Settlement Offer Review", desc: "Task: Summarize a new settlement offer and draft a pros/cons memo for the attorney." },
    { id: "witness_statement", label: "Witness Statement Discrepancy", desc: "Task: Two witness statements contradict each other. Analyze both and flag the issues." },
    { id: "demand_letter", label: "Draft a Demand Letter", desc: "Task: Draft a demand letter to the opposing insurer using medical records, accident report, and lost wages summary." },
    { id: "medical_records", label: "Medical Records Review", desc: "Task: Review 80 pages of medical records and prepare a damages summary for mediation in 3 days." },
    { id: "wrong_documents", label: "Opposing Counsel Sent Wrong Documents", desc: "Task: Opposing counsel appears to have sent privileged documents by mistake. Assess and advise next steps." },
    { id: "filing_error", label: "Court Filing Error Discovered", desc: "Task: A motion was filed with the wrong case number. Deadline was yesterday. Attorney is in trial. Act fast." },
  ],
};

const ROLE_COLORS = {
  "Intake Specialist": "bg-blue-600",
  "Legal Assistant": "bg-purple-600",
  "Paralegal": "bg-emerald-600",
};

async function callClaude(messages, systemPrompt) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data.text;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-gray-700 rounded-2xl rounded-tl-sm w-fit">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

const buildSystemPrompt = (r, s) => `You are simulating a real interaction in a law firm environment.
ROLE: You will act as ${r === "Paralegal" ? "a supervising attorney" : "a potential client"} for the following scenario.
SCENARIO: ${s.desc}
INSTRUCTIONS:
- Start the conversation with a realistic opening message
- Be realistic and natural
- Do not provide all information immediately
- Only reveal details if the user asks appropriate questions
- Adjust tone based on the scenario personality
- Keep responses concise (2-4 sentences max)
DO NOT break character or provide feedback during the conversation.`;

const buildEvalPrompt = (r, s, transcript) => `You are a senior legal trainer evaluating a trainee's performance.
ROLE: ${r}
SCENARIO: ${s.label} — ${s.desc}
TRANSCRIPT:
${transcript}
CRITERIA for ${r}:
${r === "Intake Specialist" ? "- Greeting and professionalism\n- Empathy and tone\n- Call control\n- Questioning and qualification\n- Closing and next steps" : r === "Legal Assistant" ? "- Professional tone\n- Clarity of communication\n- Problem-solving\n- Client handling" : "- Issue spotting\n- Legal workflow understanding\n- Organization\n- Drafting quality"}

OUTPUT FORMAT (use exactly this):
OVERALL SCORE: [X/10]
STRENGTHS:
- [point]
WEAKNESSES:
- [point]
MISSED OPPORTUNITIES:
- [item]
SUGGESTED IMPROVED RESPONSES:
- [example]
FINAL RECOMMENDATION:
[2-3 sentence actionable advice]`;

export default function App() {
  const [role, setRole] = useState("");
  const [scenario, setScenario] = useState(null);
  const [phase, setPhase] = useState("setup");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, aiLoading]);

  async function startSimulation() {
    if (!role || !scenario) return;
    setPhase("chat");
    setAiLoading(true);
    const text = await callClaude(
      [{ role: "user", content: "Begin the scenario. Send your opening message now." }],
      buildSystemPrompt(role, scenario)
    );
    setMessages([{ role: "ai", text }]);
    setAiLoading(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || aiLoading) return;
    setInput("");
    const newMsgs = [...messages, { role: "user", text }];
    setMessages(newMsgs);
    setAiLoading(true);
    const apiMsgs = [
      { role: "user", content: "Begin the scenario. Send your opening message now." },
      ...newMsgs.flatMap((m, i) =>
        i === 0 && m.role === "ai" ? [{ role: "assistant", content: m.text }]
        : m.role === "ai" ? [{ role: "assistant", content: m.text }]
        : [{ role: "user", content: m.text }]
      ),
    ];
    const aiText = await callClaude(apiMsgs, buildSystemPrompt(role, scenario));
    setMessages([...newMsgs, { role: "ai", text: aiText }]);
    setAiLoading(false);
  }

  async function endSession() {
    setPhase("evaluating");
    const transcript = messages.map(m => `${m.role === "user" ? "TRAINEE" : "SIMULATION"}: ${m.text}`).join("\n\n");
    const evalText = await callClaude(
      [{ role: "user", content: "Evaluate the following training session." }],
      buildEvalPrompt(role, scenario, transcript)
    );
    setEvaluation(evalText);
    setPhase("results");
  }

  function reset() {
    setRole(""); setScenario(null); setPhase("setup");
    setMessages([]); setInput(""); setEvaluation(null);
  }

  function parseEval(text) {
    const score = text.match(/OVERALL SCORE:\s*([^\n]+)/)?.[1]?.trim();
    const section = (label) => {
      const re = new RegExp(`${label}:\\n([\\s\\S]*?)(?=\\n[A-Z ]+:|$)`);
      return text.match(re)?.[1]?.trim().split("\n").map(l => l.replace(/^[•\-]\s*/, "").trim()).filter(Boolean) || [];
    };
    const rec = text.match(/FINAL RECOMMENDATION:\n([\s\S]*?)$/)?.[1]?.trim();
    return { score, strengths: section("STRENGTHS"), weaknesses: section("WEAKNESSES"), missed: section("MISSED OPPORTUNITIES"), suggested: section("SUGGESTED IMPROVED RESPONSES"), rec };
  }

  const roleColor = ROLE_COLORS[role] || "bg-gray-600";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">⚖️ Legal Staff AI Training Simulator</h1>
          <p className="text-gray-400 text-sm">Practice real scenarios and get instant feedback</p>
        </div>
        {phase !== "setup" && (
          <button onClick={reset} className="text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition">↺ Reset</button>
        )}
      </header>
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-6">
        {phase === "setup" && (
          <div className="flex flex-col gap-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Your Role</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(SCENARIOS).map(r => (
                  <button key={r} onClick={() => { setRole(r); setScenario(null); }}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border transition ${role === r ? `${ROLE_COLORS[r]} border-transparent text-white` : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {role && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Select a Scenario</label>
                <div className="flex flex-col gap-3">
                  {SCENARIOS[role].map(s => (
                    <button key={s.id} onClick={() => setScenario(s)}
                      className={`text-left p-4 rounded-xl border transition ${scenario?.id === s.id ? `${roleColor} border-transparent` : "bg-gray-800 border-gray-700 hover:border-gray-500"}`}>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-sm text-gray-300 mt-1">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {role && scenario && (
              <button onClick={startSimulation} className={`${roleColor} py-4 rounded-2xl font-semibold text-lg transition hover:opacity-90`}>
                Start Simulation →
              </button>
            )}
          </div>
        )}
        {phase === "chat" && (
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleColor}`}>{role}</span>
              <span className="text-sm text-gray-300">{scenario?.label}</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-64 max-h-96 bg-gray-900 rounded-2xl p-4 border border-gray-800">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? `${roleColor} rounded-tr-sm` : "bg-gray-700 rounded-tl-sm"}`}>
                    {m.role === "ai" && <div className="text-xs text-gray-400 mb-1 font-semibold">SIMULATION</div>}
                    {m.text}
                  </div>
                </div>
              ))}
              {aiLoading && <div className="flex justify-start"><TypingIndicator /></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type your response..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-500 transition" />
              <button onClick={sendMessage} disabled={aiLoading || !input.trim()}
                className={`${roleColor} px-4 py-3 rounded-xl font-medium text-sm transition hover:opacity-90 disabled:opacity-40`}>
                Send
              </button>
            </div>
            <button onClick={endSession} className="py-3 rounded-xl border border-red-800 text-red-400 hover:bg-red-900/30 text-sm font-medium transition">
              End Session & Get Evaluation
            </button>
          </div>
        )}
        {phase === "evaluating" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Analyzing your session...</p>
          </div>
        )}
        {phase === "results" && evaluation && (() => {
          const e = parseEval(evaluation);
          const scoreNum = parseFloat(e.score);
          const scoreColor = scoreNum >= 8 ? "text-emerald-400" : scoreNum >= 5 ? "text-yellow-400" : "text-red-400";
          return (
            <div className="flex flex-col gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <div className="text-sm text-gray-400 mb-1">Overall Score</div>
                <div className={`text-6xl font-bold ${scoreColor}`}>{e.score}</div>
                <div className="text-gray-500 text-sm mt-1">{scenario?.label} · {role}</div>
              </div>
              {[
                { title: "✅ Strengths", items: e.strengths, color: "text-emerald-400" },
                { title: "⚠️ Weaknesses", items: e.weaknesses, color: "text-yellow-400" },
                { title: "🎯 Missed Opportunities", items: e.missed, color: "text-orange-400" },
                { title: "💡 Suggested Responses", items: e.suggested, color: "text-blue-400" },
              ].map(({ title, items, color }) => items?.length > 0 && (
                <div key={title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className={`font-semibold mb-3 ${color}`}>{title}</h3>
                  <ul className="flex flex-col gap-2">
                    {items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-gray-600 mt-0.5">•</span><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {e.rec && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-semibold mb-2 text-white">📋 Final Recommendation</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{e.rec}</p>
                </div>
              )}
              <button onClick={reset} className={`${roleColor} py-4 rounded-2xl font-semibold transition hover:opacity-90`}>
                Start New Session
              </button>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
