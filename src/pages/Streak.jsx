import { useState, useEffect } from "react";
import { Shield, Trophy, Zap, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

// ── Motivational messages ─────────────────────────────────────────────
function getMotivation(streak) {
  if (streak === 0) return { msg: "Start your streak today 🚀", color: "#00f5ff" };
  if (streak < 3)   return { msg: "You're warming up — don't stop now 🔥", color: "#00f5ff" };
  if (streak < 7)   return { msg: "Building real momentum. Keep going 💪", color: "#39ff14" };
  if (streak < 14)  return { msg: "One week strong. You're in the zone 🎯", color: "#39ff14" };
  if (streak < 30)  return { msg: "Streak machine. You're ahead of 90% of users 🏆", color: "#fb923c" };
  return { msg: "LEGENDARY. You are Synthetica 🌟", color: "#a78bfa" };
}

// ── Build last-N-days map from win logs ───────────────────────────────
function buildDayMap(wins, days = 56) {
  const map = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map[d.toISOString().split("T")[0]] = "empty";
  }
  wins.forEach(w => {
    const day = (w.appliedAt ?? w.created_date ?? "").split("T")[0];
    if (day && day in map) map[day] = "win";
  });
  return map;
}

export default function Streak() {
  const [streakData, setStreakData]   = useState(null);
  const [wins,       setWins]        = useState([]);
  const [dayMap,     setDayMap]      = useState({});
  const [loading,    setLoading]     = useState(true);
  const [freezeMsg,  setFreezeMsg]   = useState("");
  const [repairMsg,  setRepairMsg]   = useState("");

  const load = async () => {
    try {
      const user = await base44.auth.me();
      const [streaks, winLogs] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.WinLog.filter({ userId: user.id }, "-created_date", 60),
      ]);
      setStreakData(streaks[0] ?? null);
      setWins(winLogs);
      setDayMap(buildDayMap(winLogs, 56));
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUseFreeze = async () => {
    if (!streakData || (streakData.freezeCount ?? 0) <= 0) {
      setFreezeMsg("No freezes left! Complete missions to earn more.");
      setTimeout(() => setFreezeMsg(""), 3000);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.Streak.update(streakData.id, {
      freezeCount:       (streakData.freezeCount ?? 0) - 1,
      lastCompletedDate: today,
    });
    setFreezeMsg("🛡️ Freeze used! Streak protected for today.");
    setTimeout(() => setFreezeMsg(""), 3000);
    load();
  };

  const handleRepairStreak = async () => {
    if (!streakData) return;
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.Streak.update(streakData.id, {
      currentStreak:     Math.max((streakData.currentStreak ?? 0), 1),
      lastCompletedDate: today,
    });
    setRepairMsg("🔧 Streak repaired! Go log a win today to keep it alive.");
    setTimeout(() => setRepairMsg(""), 3500);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ["#00f5ff", "#39ff14"] });
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
      </div>
    );
  }

  const streak      = streakData?.currentStreak  ?? 0;
  const longest     = streakData?.longestStreak  ?? 0;
  const freezes     = streakData?.freezeCount    ?? 0;
  const totalWins   = streakData?.totalWins      ?? 0;
  const isHighStreak = streak >= 7;
  const { msg: motMsg, color: motColor } = getMotivation(streak);
  const days = Object.keys(dayMap).sort();

  return (
    <div className="px-4 py-6 space-y-6 pb-24">

      {/* ── Streak hero ── */}
      <div className="flex flex-col items-center py-6 space-y-3 rounded-3xl border relative overflow-hidden"
        style={{
          borderColor: "rgba(0,245,255,0.3)",
          background: "linear-gradient(135deg, rgba(0,245,255,0.06), rgba(57,255,20,0.03))",
        }}>
        {/* Glow orb */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,245,255,0.12), transparent 70%)" }} />

        <span
          className="text-7xl leading-none select-none"
          style={{
            filter: isHighStreak
              ? "drop-shadow(0 0 12px #ff6b35) drop-shadow(0 0 28px #ff6b35)"
              : "drop-shadow(0 0 6px #ff6b35)",
            animation: isHighStreak ? "streak-fire 0.8s ease-in-out infinite" : "bounce 1.6s infinite",
          }}
        >
          🔥
        </span>

        <div>
          <div className="text-7xl font-black text-center tabular-nums text-[#00f5ff] leading-none">
            {streak}
          </div>
          <div className="text-sm font-semibold text-center text-muted-foreground mt-1">
            {streak === 1 ? "day streak" : "day streak"}
          </div>
        </div>

        {/* Motivational line */}
        <p className="text-sm font-bold text-center px-6" style={{ color: motColor }}>
          {motMsg}
        </p>
      </div>

      {/* ── Toast messages ── */}
      {(freezeMsg || repairMsg) && (
        <div className="rounded-2xl px-4 py-3 text-sm font-bold text-center"
          style={{ background: "rgba(57,255,20,0.12)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.3)" }}>
          {freezeMsg || repairMsg}
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Trophy, label: "Longest",    value: String(longest),   color: "#fb923c" },
          { icon: Zap,    label: "Total Wins", value: String(totalWins), color: "#39ff14" },
          { icon: Shield, label: "Freezes",    value: String(freezes),   color: "#00f5ff" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border bg-card p-3 text-center space-y-1.5">
            <Icon className="w-5 h-5 mx-auto" style={{ color }} />
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* ── 8-week calendar grid ── */}
      <div className="rounded-3xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Activity (last 8 weeks)</h2>
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1.5">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground">{d}</div>
          ))}
        </div>
        {/* Day cells — pad start to align with correct weekday */}
        {(() => {
          const firstDay = days[0] ? new Date(days[0]).getDay() : 0;
          // convert Sun=0 to Mon=0
          const offset = (firstDay + 6) % 7;
          const cells = [
            ...Array(offset).fill(null),
            ...days,
          ];
          const rows = [];
          for (let i = 0; i < cells.length; i += 7) {
            rows.push(cells.slice(i, i + 7));
          }
          return rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 gap-1.5">
              {row.map((day, di) => {
                if (!day) return <div key={di} className="aspect-square" />;
                const status = dayMap[day];
                const isToday = day === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={di}
                    title={day}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-sm transition-all",
                      status === "win"   ? "bg-[#39ff14]/20 border border-[#39ff14]/50" : "bg-secondary/50 border border-border",
                      isToday           ? "ring-1 ring-[#00f5ff]" : ""
                    )}
                  >
                    {status === "win" ? (
                      <span style={{ fontSize: 12, filter: "drop-shadow(0 0 4px #39ff14)" }}>🔥</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ));
        })()}
        {/* Legend */}
        <div className="flex items-center gap-4 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#39ff14]/20 border border-[#39ff14]/50" />
            <span className="text-[10px] text-muted-foreground">Win</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-secondary/50 border border-border" />
            <span className="text-[10px] text-muted-foreground">Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm ring-1 ring-[#00f5ff] border border-border" />
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
        </div>
      </div>

      {/* ── Freeze power-ups ── */}
      <div className="rounded-3xl border p-4 space-y-3"
        style={{ borderColor: "rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00f5ff]" />
          <span className="text-sm font-bold">Streak Freeze Power-Ups</span>
          <span className="ml-auto text-xs font-black text-[#00f5ff]">{freezes} left</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Use a freeze to protect your streak on a day you can't complete a mission.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleUseFreeze}
            disabled={freezes <= 0}
            className="py-3 rounded-2xl text-sm font-black text-black transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#00f5ff", boxShadow: freezes > 0 ? "0 0 16px rgba(0,245,255,0.35)" : "none" }}
          >
            🛡️ Use Freeze
          </button>
          <button
            className="py-3 rounded-2xl text-sm font-bold border transition-all duration-200 active:scale-95"
            style={{ borderColor: "rgba(0,245,255,0.3)", color: "#00f5ff" }}
            onClick={() => alert("💎 Freeze Shop — coming soon!")}
          >
            💎 Buy Freeze
          </button>
        </div>
      </div>

      {/* ── Repair streak ── */}
      <div className="rounded-3xl border p-4 flex items-center gap-4"
        style={{ borderColor: "rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.04)" }}>
        <RefreshCw className="w-5 h-5 shrink-0" style={{ color: "#fb923c" }} />
        <div className="flex-1">
          <div className="text-sm font-bold">Repair Streak</div>
          <div className="text-xs text-muted-foreground mt-0.5">Missed yesterday? Restore your streak once.</div>
        </div>
        <button
          onClick={handleRepairStreak}
          className="px-4 py-2 rounded-xl text-xs font-black text-black transition-all active:scale-95"
          style={{ background: "#fb923c", boxShadow: "0 0 12px rgba(251,146,60,0.35)" }}
        >
          Repair
        </button>
      </div>

      {/* ── Recent wins list ── */}
      {wins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold px-1">Recent Wins</h2>
          <div className="space-y-2">
            {wins.slice(0, 10).map((win) => (
              <div key={win.id}
                className="rounded-2xl border bg-card p-3.5 flex items-center gap-3"
                style={{ borderColor: "rgba(57,255,20,0.15)" }}>
                <div className="text-xl shrink-0">🏆</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{win.note ?? "Mission win"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ⏱ {win.timeSavedMinutes ?? 0}m saved ·{" "}
                    <span style={{ color: "#39ff14" }}>{"★".repeat(win.correctnessBoost ?? 0)}</span>
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">
                  {win.appliedAt
                    ? new Date(win.appliedAt).toLocaleDateString("en", { month: "short", day: "numeric" })
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {wins.length === 0 && !loading && (
        <div className="rounded-3xl border bg-card p-8 text-center space-y-2">
          <div className="text-4xl">🎯</div>
          <p className="text-sm font-bold">No wins yet</p>
          <p className="text-xs text-muted-foreground">Complete your first mission to start your streak!</p>
        </div>
      )}

    </div>
  );
}