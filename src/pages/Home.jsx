import { useOutletContext } from "react-router-dom";
import { Zap, Clock, ChevronRight, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

// ── Placeholder data ──────────────────────────────────────────────────
const TODAY_MISSION = {
  title: "Prompt Power-Up",
  type: "quick-win",
  durationMinutes: 3,
  xpReward: 75,
  category: "prompting",
  description: "Rewrite a vague request into a crystal-clear prompt and watch the output quality jump.",
  applyInstruction: "Open ChatGPT or your AI tool right now. Rewrite your last prompt using role + task + format.",
};

const RECENT_WINS = [
  { id: 1, title: "Zero-Shot Email Draft", timeSaved: 12, correctnessBoost: 4, appliedAt: "Today", category: "writing" },
  { id: 2, title: "Research Summarizer", timeSaved: 22, correctnessBoost: 5, appliedAt: "Yesterday", category: "research" },
  { id: 3, title: "Python Snippet Fix", timeSaved: 8, correctnessBoost: 3, appliedAt: "2d ago", category: "python" },
];

const SIGNAL_TIP = "GPT-4o now supports real-time audio streaming. Use it to build voice-based AI workflows in under 10 minutes.";

const CATEGORY_COLORS = {
  prompting: "#00f5ff",
  writing: "#39ff14",
  research: "#a78bfa",
  python: "#fb923c",
  automation: "#f472b6",
};

// ── Component ─────────────────────────────────────────────────────────
export default function Home() {
  const { deepDive } = useOutletContext() || {};
  const [started, setStarted] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const streakNumber = 7; // placeholder
  const milestoneRef = useRef(false);

  // Fire confetti on streak milestone
  useEffect(() => {
    if (!milestoneRef.current && streakNumber > 0 && streakNumber % 7 === 0) {
      milestoneRef.current = true;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#00f5ff", "#39ff14", "#ffffff", "#fb923c"],
      });
    }
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const handleStart = () => {
    setStarted(true);
    showToast(deepDive ? "Deep Dive mode — let's go 🚀" : "Quick-Win activated ⚡");
  };

  return (
    <div className="px-4 py-5 space-y-5 relative">

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-bold text-black shadow-xl transition-all"
          style={{ background: "#00f5ff", boxShadow: "0 0 24px rgba(0,245,255,0.5)" }}>
          {toastMsg}
        </div>
      )}

      {/* ── Streak hero ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="text-5xl" style={{ filter: "drop-shadow(0 0 12px #ff6b35)", animation: "bounce 1.4s infinite" }}>
            🔥
          </span>
          <div>
            <div className="text-3xl font-black leading-none" style={{ color: "#00f5ff" }}>
              {streakNumber} days
            </div>
            <div className="text-xs text-muted-foreground font-semibold mt-0.5">
              Current streak — keep it alive!
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black" style={{ color: "#39ff14" }}>425</div>
          <div className="text-[10px] text-muted-foreground font-medium">Total XP</div>
        </div>
      </div>

      {/* ── Today's Mission card ── */}
      <div
        className="rounded-3xl border p-5 space-y-4 relative overflow-hidden"
        style={{
          borderColor: "rgba(0,245,255,0.35)",
          background: "linear-gradient(135deg, rgba(0,245,255,0.07) 0%, rgba(57,255,20,0.04) 100%)",
          boxShadow: "0 0 40px rgba(0,245,255,0.08)",
        }}
      >
        {/* Glow orb */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,245,255,0.15), transparent 70%)" }} />

        {/* Badge row */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full"
            style={{ background: deepDive ? "#39ff14" : "#00f5ff", color: "#000" }}>
            {deepDive ? "🔬 Deep Dive" : <><Zap className="w-3 h-3" />Quick-Win</>}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {deepDive ? "10 min" : `${TODAY_MISSION.durationMinutes} min`}
            </span>
            <span className="font-bold" style={{ color: "#39ff14" }}>+{TODAY_MISSION.xpReward} XP</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            Today's Mission
          </p>
          <h2 className="text-2xl font-black leading-tight">{TODAY_MISSION.title}</h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {TODAY_MISSION.description}
          </p>
        </div>

        {/* Apply instruction */}
        <div className="rounded-2xl px-4 py-3 text-xs font-medium leading-relaxed"
          style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14", borderLeft: "3px solid #39ff14" }}>
          💡 <span className="font-bold">Apply now:</span> {TODAY_MISSION.applyInstruction}
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          style={{
            background: started
              ? "linear-gradient(90deg, #39ff14, #00f5ff)"
              : "#00f5ff",
            boxShadow: `0 0 ${started ? "28px" : "16px"} rgba(0,245,255,${started ? "0.6" : "0.35"})`,
          }}
        >
          {started ? (
            <><CheckCircle2 className="w-5 h-5" /> Mission In Progress</>
          ) : (
            <><Zap className="w-5 h-5" /> Start Mission</>
          )}
        </button>
      </div>

      {/* ── Weekly impact ── */}
      <div className="rounded-3xl border bg-card p-4 space-y-3"
        style={{ borderColor: "rgba(57,255,20,0.2)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#39ff14" }} />
            <span className="text-sm font-bold">This Week's Impact</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Mon–Sun</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: "4.2 hrs", label: "Time Saved", color: "#39ff14" },
            { value: "5", label: "Missions", color: "#00f5ff" },
            { value: "3.8", label: "Avg Boost", color: "#a78bfa" },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        {/* Progress bar toward weekly goal */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>5 / 7 missions this week</span>
            <span className="font-semibold" style={{ color: "#39ff14" }}>71%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: "71%", background: "linear-gradient(90deg, #39ff14, #00f5ff)" }} />
          </div>
        </div>
      </div>

      {/* ── Recent Wins carousel ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold">Recent Wins</h3>
          <button className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: "#00f5ff" }}>
            All wins <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {RECENT_WINS.map((win) => (
            <div key={win.id}
              className="shrink-0 w-44 rounded-2xl border bg-card p-3.5 space-y-2.5 snap-start"
              style={{ borderColor: `${CATEGORY_COLORS[win.category] || "#444"}33` }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: `${CATEGORY_COLORS[win.category] || "#00f5ff"}22`,
                    color: CATEGORY_COLORS[win.category] || "#00f5ff"
                  }}>
                  {win.category}
                </span>
                <span className="text-[10px] text-muted-foreground">{win.appliedAt}</span>
              </div>
              <p className="text-xs font-bold leading-snug line-clamp-2">{win.title}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  ⏱ {win.timeSaved}m saved
                </span>
                <span className="text-[10px] font-bold" style={{ color: "#39ff14" }}>
                  {"★".repeat(win.correctnessBoost)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Signal Snapshot ── */}
      <div className="rounded-3xl border p-4 space-y-2"
        style={{
          borderColor: "rgba(167,139,250,0.3)",
          background: "rgba(167,139,250,0.05)",
        }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#a78bfa" }}>
            Signal Snapshot
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto">Frontier tip</span>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{SIGNAL_TIP}</p>
        <button className="text-xs font-bold flex items-center gap-0.5"
          style={{ color: "#a78bfa" }}>
          Explore missions on this <ChevronRight className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}