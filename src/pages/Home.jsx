import { useOutletContext, useNavigate } from "react-router-dom";
import { Zap, Clock, ChevronRight, TrendingUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { base44 } from "@/api/base44Client";

const SIGNAL_TIP = "GPT-4o now supports real-time audio streaming. Use it to build voice-based AI workflows in under 10 minutes.";

const CATEGORY_COLORS = {
  prompting: "#00f5ff",
  writing: "#39ff14",
  research: "#a78bfa",
  python: "#fb923c",
  automation: "#f472b6",
};

const WEEKLY_GOAL = 7;

export default function Home() {
  const { deepDive } = useOutletContext() || {};
  const navigate = useNavigate();

  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [mission, setMission] = useState(null);
  const [recentWins, setRecentWins] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({ timeSaved: 0, missions: 0, avgBoost: "0" });
  const [loading, setLoading] = useState(true);
  const milestoneRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const [streaks, stats, missions, wins] = await Promise.all([
          base44.entities.Streak.filter({ userId: user.id }),
          base44.entities.UserStats.filter({ userId: user.id }),
          base44.entities.Mission.list("-created_date", 1),
          base44.entities.WinLog.filter({ userId: user.id }, "-created_date", 10),
        ]);

        const currentStreak = streaks[0]?.currentStreak ?? 0;
        setStreak(currentStreak);
        setXp(stats[0]?.totalXp ?? 0);
        if (missions[0]) setMission(missions[0]);
        setRecentWins(wins.slice(0, 4));

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const weekWins = wins.filter(w => (w.created_date ?? "") >= oneWeekAgo);
        const totalTimeSaved = weekWins.reduce((s, w) => s + (w.timeSavedMinutes ?? 0), 0);
        const avgBoost = weekWins.length
          ? (weekWins.reduce((s, w) => s + (w.correctnessBoost ?? 0), 0) / weekWins.length).toFixed(1)
          : "0";
        setWeeklyStats({ timeSaved: totalTimeSaved, missions: weekWins.length, avgBoost });

        if (!milestoneRef.current && currentStreak > 0 && currentStreak % 7 === 0) {
          milestoneRef.current = true;
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#00f5ff", "#39ff14", "#ffffff", "#fb923c"] });
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const weekPct = Math.min(Math.round((weeklyStats.missions / WEEKLY_GOAL) * 100), 100);
  const hoursDisplay = weeklyStats.timeSaved >= 60
    ? `${(weeklyStats.timeSaved / 60).toFixed(1)} hrs`
    : `${weeklyStats.timeSaved} min`;

  return (
    <div className="px-4 py-5 space-y-5">

      {/* ── Streak hero ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none"
            style={{ filter: "drop-shadow(0 0 12px #ff6b35)", animation: "bounce 1.4s infinite" }}>
            🔥
          </span>
          <div>
            <div className="text-3xl font-black leading-none text-[#00f5ff]">{streak} days</div>
            <div className="text-xs text-muted-foreground font-semibold mt-0.5">Current streak — keep it alive!</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-[#39ff14]">{xp}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Total XP</div>
        </div>
      </div>

      {/* ── Today's Mission card ── */}
      {!loading && mission && (
        <div className="rounded-3xl border p-5 space-y-4 relative overflow-hidden"
          style={{
            borderColor: "rgba(0,245,255,0.35)",
            background: "linear-gradient(135deg, rgba(0,245,255,0.07) 0%, rgba(57,255,20,0.04) 100%)",
            boxShadow: "0 0 40px rgba(0,245,255,0.08)",
          }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,245,255,0.15), transparent 70%)" }} />

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full text-black"
              style={{ background: deepDive ? "#39ff14" : "#00f5ff" }}>
              {deepDive ? "🔬 Deep Dive" : <><Zap className="w-3 h-3" />Quick-Win</>}
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {deepDive ? "10 min" : `${mission.durationMinutes ?? 3} min`}
              </span>
              <span className="font-bold text-[#39ff14]">+{mission.xpReward ?? 75} XP</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Today's Mission</p>
            <h2 className="text-2xl font-black leading-tight">{mission.title}</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{mission.description}</p>
          </div>

          <div className="rounded-2xl px-4 py-3 text-xs font-medium leading-relaxed text-[#39ff14]"
            style={{ background: "rgba(57,255,20,0.1)", borderLeft: "3px solid #39ff14" }}>
            💡 <span className="font-bold">Apply now:</span> {mission.applyInstruction}
          </div>

          <button
            onClick={() => navigate(`/mission/${mission.id}`)}
            className="w-full py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            style={{ background: "#00f5ff", boxShadow: "0 0 20px rgba(0,245,255,0.4)" }}>
            <Zap className="w-5 h-5" /> Start Mission
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-3xl border p-5 space-y-4 animate-pulse"
          style={{ borderColor: "rgba(0,245,255,0.2)" }}>
          <div className="h-6 w-32 bg-secondary rounded-full" />
          <div className="h-8 w-3/4 bg-secondary rounded-xl" />
          <div className="h-4 w-full bg-secondary rounded-lg" />
          <div className="h-14 w-full bg-secondary rounded-2xl" />
        </div>
      )}

      {/* ── Weekly impact ── */}
      <div className="rounded-3xl border bg-card p-4 space-y-3"
        style={{ borderColor: "rgba(57,255,20,0.2)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#39ff14]" />
            <span className="text-sm font-bold">This Week's Impact</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Mon–Sun</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: hoursDisplay, label: "Time Saved", color: "#39ff14" },
            { value: String(weeklyStats.missions), label: "Missions", color: "#00f5ff" },
            { value: String(weeklyStats.avgBoost), label: "Avg Boost", color: "#a78bfa" },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>{weeklyStats.missions} / {WEEKLY_GOAL} missions this week</span>
            <span className="font-semibold text-[#39ff14]">{weekPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${weekPct}%`, background: "linear-gradient(90deg, #39ff14, #00f5ff)" }} />
          </div>
        </div>
      </div>

      {/* ── Recent Wins carousel ── */}
      {recentWins.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold">Recent Wins</h3>
            <button className="flex items-center gap-0.5 text-xs font-semibold text-[#00f5ff]">
              All wins <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {recentWins.map((win) => {
              const color = CATEGORY_COLORS[win.category] ?? "#00f5ff";
              return (
                <div key={win.id}
                  className="shrink-0 w-44 rounded-2xl border bg-card p-3.5 space-y-2.5 snap-start"
                  style={{ borderColor: `${color}33` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${color}22`, color }}>
                      {win.category ?? "win"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {win.appliedAt ? new Date(win.appliedAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-snug line-clamp-2">{win.note ?? "Mission win"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">⏱ {win.timeSavedMinutes ?? 0}m saved</span>
                    <span className="text-[10px] font-bold text-[#39ff14]">
                      {"★".repeat(win.correctnessBoost ?? 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Signal Snapshot ── */}
      <div className="rounded-3xl border p-4 space-y-2"
        style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.05)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#a78bfa" }}>Signal Snapshot</span>
          <span className="text-[10px] text-muted-foreground ml-auto">Frontier tip</span>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{SIGNAL_TIP}</p>
        <button className="text-xs font-bold flex items-center gap-0.5" style={{ color: "#a78bfa" }}>
          Explore missions on this <ChevronRight className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}