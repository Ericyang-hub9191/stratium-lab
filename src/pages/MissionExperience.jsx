import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ChevronDown, ChevronUp, ArrowLeft, Zap } from "lucide-react";
import WinLoggerModal from "../components/WinLoggerModal";

// Placeholder mission — will be replaced by real entity data
const MISSION = {
  id: "mission-001",
  title: "Prompt Power-Up",
  type: "quick-win",
  durationMinutes: 3,
  xpReward: 75,
  category: "prompting",
  description: "Vague prompts get vague answers. Learn to add role + task + format in under 3 minutes and watch output quality jump instantly.",
  applyInstruction: "Open ChatGPT, Claude, or Gemini right now. Take your last prompt and rewrite it using this structure:\n\n🎯 Role: \"Act as a senior [job role]\"\n📋 Task: \"Help me [specific task]\"\n📐 Format: \"Respond as a [bullet list / email / table]\"",
  learnWhy: "LLMs are next-token predictors. By specifying role, task, and format upfront you narrow the probability distribution toward exactly the output you need — no back-and-forth required. This single habit saves 8–15 minutes per session on average.",
};

function useTimer(minutes) {
  const totalSecs = minutes * 60;
  const [seconds, setSeconds] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running && seconds > 0) {
      ref.current = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running, seconds]);

  const start = () => setRunning(true);
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return { display: `${mins}:${secs}`, start, running, done: seconds === 0, pct: ((totalSecs - seconds) / totalSecs) * 100 };
}

export default function MissionExperience() {
  const navigate = useNavigate();
  const timer = useTimer(MISSION.durationMinutes);
  const [learnOpen, setLearnOpen] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);

  const handleApply = () => {
    if (!timer.running) timer.start();
    setShowApply(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl border bg-secondary flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full"
          style={{ background: "#00f5ff", color: "#000" }}>
          <Zap className="w-3 h-3" /> Quick-Win
        </span>
        {/* Circular timer */}
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none"
              stroke={timer.done ? "#39ff14" : "#00f5ff"}
              strokeWidth="3"
              strokeDasharray={`${100.5 * timer.pct / 100} 100.5`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-black tabular-nums"
              style={{ color: timer.done ? "#39ff14" : "#00f5ff" }}>
              {timer.display}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-32">

        {/* Title + meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {MISSION.durationMinutes} min ·
            <span style={{ color: "#39ff14" }}>+{MISSION.xpReward} XP</span>
            · {MISSION.category}
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">{MISSION.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{MISSION.description}</p>
        </div>

        {/* Apply instruction (the star of the screen) */}
        <div className="rounded-3xl border p-5 space-y-2"
          style={{
            borderColor: "rgba(0,245,255,0.4)",
            background: "linear-gradient(135deg, rgba(0,245,255,0.07), rgba(57,255,20,0.04))",
          }}>
          <div className="text-xs font-black uppercase tracking-widest mb-3"
            style={{ color: "#00f5ff" }}>
            ⚡ Try This Right Now
          </div>
          {MISSION.applyInstruction.split("\n").map((line, i) => (
            <p key={i} className={`text-sm leading-relaxed ${line.startsWith("🎯") || line.startsWith("📋") || line.startsWith("📐") ? "font-bold" : "text-muted-foreground"}`}>
              {line || <br />}
            </p>
          ))}
        </div>

        {/* Placeholder interactive area */}
        <div className="rounded-3xl border bg-card p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Your Prompt Draft
          </p>
          <textarea
            rows={4}
            placeholder={`Act as a senior [role].\nHelp me [task].\nRespond as a [format].`}
            className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm resize-none outline-none border border-transparent focus:border-[#00f5ff] transition-colors placeholder:text-muted-foreground/50 font-mono"
          />
          <p className="text-[10px] text-muted-foreground">Draft here, then paste it into your AI tool.</p>
        </div>

        {/* Learn Why — collapsible */}
        {showApply && (
          <div className="rounded-3xl border overflow-hidden"
            style={{ borderColor: "rgba(167,139,250,0.3)" }}>
            <button
              onClick={() => setLearnOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold"
              style={{ color: "#a78bfa" }}>
              <span>🧠 Learn Why This Works</span>
              {learnOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {learnOpen && (
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed"
                style={{ background: "rgba(167,139,250,0.05)" }}>
                {MISSION.learnWhy}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Apply Now button ── */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-4 z-40"
        style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent)" }}>
        <button
          onClick={showApply ? () => setLoggerOpen(true) : handleApply}
          className="w-full max-w-sm mx-4 py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          style={{
            background: showApply
              ? "linear-gradient(90deg, #39ff14, #00e5ff)"
              : "#39ff14",
            boxShadow: `0 0 ${showApply ? "32px" : "20px"} rgba(57,255,20,${showApply ? "0.6" : "0.4"})`,
          }}>
          {showApply ? (
            <><Zap className="w-5 h-5" /> Log Win 🏆</>
          ) : (
            <>✅ I Applied It — Start Timer</>
          )}
        </button>
      </div>

      {/* ── Win Logger Modal ── */}
      <WinLoggerModal
        open={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        mission={MISSION}
        onSuccess={() => navigate("/")}
      />
    </div>
  );
}