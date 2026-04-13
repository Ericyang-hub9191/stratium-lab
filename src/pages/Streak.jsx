import { Shield, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// Generate last 4 weeks of day cells
const weeks = Array.from({ length: 4 }, (_, wi) =>
  Array.from({ length: 7 }, (_, di) => ({ week: wi, day: di, done: false }))
);

export default function Streak() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero flame */}
      <div className="flex flex-col items-center py-4 space-y-2">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,53,0.25) 0%, rgba(255,107,53,0.05) 70%)",
            boxShadow: "0 0 40px rgba(255,107,53,0.3)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          🔥
        </div>
        <div className="text-center">
          <div className="text-6xl font-black" style={{ color: "#00f5ff" }}>
            0
          </div>
          <div className="text-sm font-semibold text-muted-foreground">
            Day Streak
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Trophy, label: "Longest", value: "0", color: "#ff6b35" },
          { icon: Zap, label: "Total Wins", value: "0", color: "#39ff14" },
          { icon: Shield, label: "Freezes", value: "3", color: "#00f5ff" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl border bg-card p-3 text-center space-y-1.5"
          >
            <Icon className="w-5 h-5 mx-auto" style={{ color }} />
            <div className="text-2xl font-black" style={{ color }}>
              {value}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Activity Calendar</h2>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-bold text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map(({ day, done }) => (
              <div
                key={day}
                className={cn(
                  "aspect-square rounded-lg border transition-all",
                  done ? "border-transparent" : "border-border bg-secondary/50"
                )}
                style={done ? { background: "#39ff14" } : {}}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Freeze power-up */}
      <div
        className="rounded-2xl border p-4 flex items-center gap-4"
        style={{ borderColor: "rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.05)" }}
      >
        <div className="text-3xl">🛡️</div>
        <div className="flex-1">
          <div className="text-sm font-bold">Streak Freeze Power-Up</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            3 freezes remaining — miss a day without breaking your streak
          </div>
          <div className="flex gap-1.5 mt-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "rgba(0,245,255,0.2)" }}
              >
                🛡️
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}