import { useOutletContext } from "react-router-dom";
import { Zap, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const { deepDive } = useOutletContext() || {};

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">
          Ready to win today?
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          3 minutes. One mission. Real-world result.
        </p>
      </div>

      {/* Hero mission card */}
      <div
        className="rounded-2xl p-5 space-y-4 border"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,245,255,0.08) 0%, rgba(57,255,20,0.06) 100%)",
          borderColor: "rgba(0,245,255,0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "#00f5ff", color: "#000" }}
          >
            <Zap className="w-3 h-3" />
            {deepDive ? "Deep Dive" : "Quick-Win"}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {deepDive ? "10 min" : "3 min"}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-bold">Today's Mission</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Missions will load here once your mission library is ready. Pick one and log the win.
          </p>
        </div>

        <div
          className="text-xs font-medium px-3 py-2 rounded-xl"
          style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14" }}
        >
          💡 Apply it: Open your email or Notion right now and try it.
        </div>

        <Link
          to="/missions"
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold text-sm text-black transition-all active:scale-95"
          style={{ background: "#00f5ff" }}
        >
          Browse Missions <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Streak summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: "🔥", value: "0", label: "Day Streak", color: "#ff6b35" },
          { emoji: "⚡", value: "0", label: "Total XP", color: "#39ff14" },
          { emoji: "🏆", value: "0", label: "Wins", color: "#00f5ff" },
        ].map(({ emoji, value, label, color }) => (
          <div
            key={label}
            className="rounded-2xl border bg-card p-3 text-center space-y-1"
          >
            <div className="text-xl">{emoji}</div>
            <div className="text-xl font-black" style={{ color }}>
              {value}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Weekly impact */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "#39ff14" }} />
          <span className="text-sm font-bold">This Week's Impact</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-black text-foreground">0 min</div>
            <div className="text-xs text-muted-foreground">Time Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-foreground">0</div>
            <div className="text-xs text-muted-foreground">Missions Done</div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: "0%", background: "#39ff14" }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Complete 5 missions this week to unlock a power-up 🎯
        </p>
      </div>
    </div>
  );
}