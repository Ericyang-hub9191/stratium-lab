import { TrendingUp, Clock, Award } from "lucide-react";

const BADGES = [
  { emoji: "🔥", label: "7-Day Win" },
  { emoji: "⚡", label: "XP Pioneer" },
  { emoji: "🎯", label: "Focused" },
  { emoji: "🚀", label: "Launched" },
];

export default function Progress() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black">Progress</h1>
        <p className="text-sm text-muted-foreground">Your real-world ROI from AI missions.</p>
      </div>

      {/* Level card */}
      <div className="rounded-2xl border p-5 space-y-3"
        style={{ borderColor: "rgba(57,255,20,0.25)", background: "rgba(57,255,20,0.05)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Level</div>
            <div className="text-5xl font-black" style={{ color: "#39ff14" }}>1</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total XP</div>
            <div className="text-3xl font-black" style={{ color: "#00f5ff" }}>0</div>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full w-0 transition-all duration-700"
            style={{ background: "linear-gradient(90deg, #39ff14, #00f5ff)" }} />
        </div>
        <p className="text-[10px] text-muted-foreground text-right">0 / 500 XP to Level 2</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4 text-center space-y-1.5">
          <Clock className="w-5 h-5 mx-auto" style={{ color: "#39ff14" }} />
          <div className="text-2xl font-black">0 min</div>
          <div className="text-xs text-muted-foreground">Time Saved</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center space-y-1.5">
          <TrendingUp className="w-5 h-5 mx-auto" style={{ color: "#00f5ff" }} />
          <div className="text-2xl font-black">0</div>
          <div className="text-xs text-muted-foreground">Missions Done</div>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4" style={{ color: "#ff6b35" }} />
          <span className="text-sm font-bold">Power-Up Badges</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {BADGES.map(({ emoji, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl opacity-30 grayscale">
                {emoji}
              </div>
              <span className="text-[9px] text-center text-muted-foreground leading-tight">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Complete missions to unlock power-up badges 🎯</p>
      </div>
    </div>
  );
}