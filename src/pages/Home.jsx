import { useOutletContext, Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

export default function Home() {
  const { deepDive } = useOutletContext() || {};

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black">Ready to win today?</h1>
        <p className="text-sm text-muted-foreground mt-0.5">3 minutes. One mission. Real result.</p>
      </div>

      {/* Hero mission card */}
      <div className="rounded-2xl border p-5 space-y-4"
        style={{ borderColor: "rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "#00f5ff", color: "#000" }}>
            <Zap className="w-3 h-3" /> {deepDive ? "Deep Dive" : "Quick-Win"}
          </span>
          <span className="text-xs text-muted-foreground">{deepDive ? "10 min" : "3 min"}</span>
        </div>
        <p className="text-sm text-muted-foreground">Your daily mission will appear here.</p>
        <Link to="/missions"
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold text-sm text-black"
          style={{ background: "#00f5ff" }}>
          Browse Missions <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: "🔥", value: "0", label: "Streak", color: "#ff6b35" },
          { emoji: "⚡", value: "0", label: "Total XP", color: "#39ff14" },
          { emoji: "🏆", value: "0", label: "Wins", color: "#00f5ff" },
        ].map(({ emoji, value, label, color }) => (
          <div key={label} className="rounded-2xl border bg-card p-3 text-center space-y-1">
            <div className="text-xl">{emoji}</div>
            <div className="text-xl font-black" style={{ color }}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}