import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, ChevronDown, ChevronUp, ArrowLeft, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import WinLoggerModal from "../components/WinLoggerModal";

function useCountdown(minutes) {
  const totalSecs = (minutes || 3) * 60;
  const [seconds, setSeconds] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running && seconds > 0) {
      ref.current = setInterval(() => setSeconds(s => s - 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running, seconds]);

  // Reset when duration changes (mission loads)
  useEffect(() => {
    setSeconds(totalSecs);
    setRunning(false);
  }, [totalSecs]);

  const pct = ((totalSecs - seconds) / totalSecs) * 100;
  const display = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { display, start: () => setRunning(true), running, done: seconds === 0, pct };
}

export default function MissionExperience() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [learnOpen, setLearnOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);

  const timer = useCountdown(mission?.durationMinutes);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    base44.entities.Mission.filter({ id })
      .then(([m]) => { if (m) setMission(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = () => {
    timer.start();
    setApplied(true);
  };

  const circumference = 2 * Math.PI * 16;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <p className="text-muted-foreground">Mission not found.</p>
        <button onClick={() => navigate("/")} className="text-[#00f5ff] font-bold text-sm">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl border bg-secondary flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full text-black bg-[#00f5ff]">
          <Zap className="w-3 h-3" /> Quick-Win
        </span>

        {/* Circular countdown */}
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none"
              stroke={timer.done ? "#39ff14" : "#00f5ff"}
              strokeWidth="3"
              strokeDasharray={`${circumference * timer.pct / 100} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-black tabular-nums"
              style={{ color: timer.done ? "#39ff14" : "#00f5ff" }}>
              {timer.display}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-32">

        {/* Title + meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {mission.durationMinutes ?? 3} min
            <span className="text-[#39ff14]">· +{mission.xpReward ?? 75} XP</span>
            · {mission.category}
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">{mission.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{mission.description}</p>
        </div>

        {/* Apply instruction */}
        <div className="rounded-3xl border p-5 space-y-2"
          style={{
            borderColor: "rgba(0,245,255,0.4)",
            background: "linear-gradient(135deg, rgba(0,245,255,0.07), rgba(57,255,20,0.04))",
          }}>
          <div className="text-xs font-black uppercase tracking-widest mb-3 text-[#00f5ff]">
            ⚡ Try This Right Now
          </div>
          {(mission.applyInstruction ?? "").split("\n").map((line, i) => (
            <p key={i} className={`text-sm leading-relaxed ${
              /^[🎯📋📐]/.test(line) ? "font-bold" : "text-muted-foreground"
            }`}>
              {line || <br />}
            </p>
          ))}
        </div>

        {/* Prompt scratch pad */}
        <div className="rounded-3xl border bg-card p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Prompt Draft</p>
          <textarea
            rows={4}
            placeholder={`Act as a senior [role].\nHelp me [task].\nRespond as a [format].`}
            className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm resize-none outline-none border border-transparent focus:border-[#00f5ff] transition-colors placeholder:text-muted-foreground/50 font-mono"
          />
          <p className="text-[10px] text-muted-foreground">Draft here, then paste into your AI tool.</p>
        </div>

        {/* Learn Why — collapsible after applying */}
        {applied && mission.learnWhy && (
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "rgba(167,139,250,0.3)" }}>
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
                {mission.learnWhy}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Floating CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-4 z-40"
        style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent)" }}>
        <button
          onClick={applied ? () => setLoggerOpen(true) : handleApply}
          className="w-full max-w-sm mx-4 py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          style={{
            background: applied ? "linear-gradient(90deg, #39ff14, #00e5ff)" : "#39ff14",
            boxShadow: applied ? "0 0 32px rgba(57,255,20,0.6)" : "0 0 20px rgba(57,255,20,0.4)",
          }}>
          {applied ? <><Zap className="w-5 h-5" /> Log Win 🏆</> : <>✅ I Applied It — Start Timer</>}
        </button>
      </div>

      <WinLoggerModal
        open={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        mission={mission}
        onSuccess={() => navigate("/")}
      />
    </div>
  );
}