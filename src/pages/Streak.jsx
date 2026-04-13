import { Shield, Trophy, Zap } from "lucide-react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKS = Array.from({ length: 4 });

export default function Streak() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="flex flex-col items-center py-4 space-y-2">
        <div className="text-6xl" style={{ animation: "bounce 1.4s infinite" }}>🔥</div>
        <div className="text-6xl font-black" style={{ color: "#00f5ff" }}>0</div>
        <div className="text-sm font-semibold text-muted-foreground">Day Streak</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Trophy, label: "Longest", value: "0", color: "#ff6b35" },
          { icon: Zap, label: "Total Wins", value: "0", color: "#39ff14" },
          { icon: Shield, label: "Freezes", value: "3", color: "#00f5ff" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border bg-card p-3 text-center space-y-1.5">
            <Icon className="w-5 h-5 mx-auto" style={{ color }} />
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Activity</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground">{d}</div>
          ))}
        </div>
        {WEEKS.map((_, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, di) => (
              <div key={di} className="aspect-square rounded-lg border border-border bg-secondary/50" />
            ))}
          </div>
        ))}
      </div>

      {/* Freeze power-up */}
      <div className="rounded-2xl border p-4 flex items-center gap-4"
        style={{ borderColor: "rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.05)" }}>
        <div className="text-3xl">🛡️</div>
        <div>
          <div className="text-sm font-bold">3 Streak Freeze Power-Ups</div>
          <div className="text-xs text-muted-foreground mt-0.5">Miss a day without breaking your streak</div>
        </div>
      </div>
    </div>
  );
}