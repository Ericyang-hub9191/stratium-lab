import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, ChevronDown, ChevronUp, ArrowLeft, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ImpactLoggerModal from "../components/WinLoggerModal";

export default function MissionExperience() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [mission,    setMission]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [learnOpen,  setLearnOpen]  = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const results = await base44.entities.Mission.filter({ id });
        if (results[0]) setMission(results[0]);
        else {
          // fallback: grab first available mission
          const all = await base44.entities.Mission.list("-created_date", 1);
          if (all[0]) setMission(all[0]);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">Mission not found.</p>
        <button onClick={() => navigate("/")} className="text-sm font-bold text-[#00f5ff]">← Back home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border bg-secondary flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full text-black bg-[#00f5ff]">
          <Zap className="w-3 h-3" /> Quick Boost
        </span>

        <span className="text-sm font-black text-[#39ff14]">+{mission?.xpReward ?? 75} XP</span>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-32">

        {/* Title + meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {mission.durationMinutes ?? 3} min ·&nbsp;
            <span className="text-[#39ff14]">+{mission.xpReward ?? 75} XP</span>
            &nbsp;· {mission.category}
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">{mission.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{mission.description}</p>
        </div>

        {/* Apply instruction */}
        <div
          className="rounded-3xl border p-5 space-y-2"
          style={{
            borderColor: "rgba(0,245,255,0.4)",
            background:  "linear-gradient(135deg, rgba(0,245,255,0.07), rgba(57,255,20,0.04))",
          }}
        >
          <p className="text-xs font-black uppercase tracking-widest text-[#00f5ff] mb-3">⚡ Try This Right Now</p>
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
            style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
          />
          <p className="text-[10px] text-muted-foreground">Draft here, then paste it into your AI tool.</p>
        </div>

        {/* Learn Why */}
        {mission.learnWhy && (
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "rgba(167,139,250,0.3)" }}>
            <button
              onClick={() => setLearnOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-[#a78bfa]"
            >
              <span>🧠 Learn Why This Works</span>
              {learnOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {learnOpen && (
              <div
                className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed"
                style={{ background: "rgba(167,139,250,0.05)" }}
              >
                {mission.learnWhy}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Floating CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-4 z-40"
        style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent)" }}
      >
        <button
          onClick={() => setLoggerOpen(true)}
          className="w-full max-w-sm mx-4 py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(90deg, #39ff14, #00f5ff)",
            boxShadow: "0 0 28px rgba(57,255,20,0.5)",
          }}
        >
          ✅ I Applied It
        </button>
      </div>

      {/* ── Impact Logger ── */}
      <ImpactLoggerModal
        open={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        mission={mission}
        onSuccess={() => navigate("/")}
      />
    </div>
  );
}