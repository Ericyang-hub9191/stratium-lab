import { useState, useEffect, useRef } from "react";
import { Shield, Trophy, Zap, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

function getMotivation(streak) {
  if (streak === 0)  return { msg: "Start today — every legend begins at zero 🚀",     color: "#00f5ff" };
  if (streak === 1)  return { msg: "Day 1 done. The hardest step is behind you 💪",     color: "#00f5ff" };
  if (streak < 3)    return { msg: "2 days in — momentum is building 🔥",               color: "#00f5ff" };
  if (streak < 7)    return { msg: `${streak} days — restart the flame. Don't stop now!`, color: "#fb923c" };
  if (streak === 7)  return { msg: "7 days strong — you're officially on fire! 🔥",     color: "#39ff14" };
  if (streak < 14)   return { msg: `${streak} days — you're in the zone. Keep going!`,  color: "#39ff14" };
  if (streak < 30)   return { msg: `${streak} days — top 10% of users. Unstoppable 🏆`, color: "#39ff14" };
  return              { msg: `${streak} days — LEGENDARY. You ARE Synthetica 🌟`,        color: "#a78bfa" };
}

function buildDayMap(wins, days = 42) {
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
  const navigate = useNavigate();
  const [streakData, setStreakData] = useState(null);
  const [wins,       setWins]       = useState([]);
  const [dayMap,     setDayMap]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const [pullDist,   setPullDist]   = useState(0);

  const load = async () => {
    try {
      const user = await base44.auth.me();
      const [streaks, winLogs] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.WinLog.filter({ userId: user.id }, "-created_date", 100),
      ]);
      setStreakData(streaks[0] ?? null);
      setWins(winLogs);
      setDayMap(buildDayMap(winLogs, 42));
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove  = (e) => {
    const dist = e.touches[0].clientY - touchStartY.current;
    if (dist > 0 && window.scrollY === 0) setPullDist(Math.min(dist, 80));
  };
  const handleTouchEnd = async () => {
    if (pullDist > 60) {
      setRefreshing(true);
      await load();
      setRefreshing(false);
    }
    setPullDist(0);
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

  const handleUseFreeze = async () => {
    if (!streakData || (streakData.freezeCount ?? 0) <= 0) {
      showMsg("❌ No freezes left! Complete missions to earn more.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.Streak.update(streakData.id, {
      freezeCount: (streakData.freezeCount ?? 0) - 1,
      lastCompletedDate: today,
    });
    showMsg("🛡️ Freeze used! Streak protected for today.");
    load();
  };

  const handleRepairStreak = async () => {
    if (!streakData) return;
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.Streak.update(streakData.id, {
      currentStreak: Math.max((streakData.currentStreak ?? 0), 1),
      lastCompletedDate: today,
    });
    showMsg("🔧 Streak repaired! Log a win today to keep it alive.");
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ["#00f5ff", "#39ff14", "#fb923c"] });
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
      </div>
    );
  }

  const streak        = streakData?.currentStreak  ?? 0;
  const longest       = streakData?.longestStreak  ?? 0;
  const freezes       = streakData?.freezeCount    ?? 0;
  const totalWins     = streakData?.totalWins      ?? 0;
  const isHighStreak  = streak >= 7;
  const { msg: motMsg, color: motColor } = getMotivation(streak);
  const days = Object.keys(dayMap).sort();

  return (
    <div
      className="px-4 py-6 space-y-6 pb-24"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-x pan-y' }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Pull-to-refresh indicator */}
      {(pullDist > 10 || refreshing) && (
        <div className="flex justify-center" style={{ marginTop: -16, marginBottom: -8, opacity: refreshing ? 1 : pullDist / 80 }}>
          <div className={`w-6 h-6 border-2 border-[#00f5ff]/40 border-t-[#00f5ff] rounded-full ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      {/* ── Flame hero ── */}
      <div
        className="flex flex-col items-center py-8 space-y-4 rounded-3xl border relative overflow-hidden"
        style={{
          borderColor: isHighStreak ? "rgba(255,107,53,0.5)" : "rgba(0,245,255,0.25)",
          background: isHighStreak
            ? "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(251,146,60,0.05))"
            : "linear-gradient(135deg, rgba(0,245,255,0.06), rgba(57,255,20,0.03))",
        }}
      >
        {/* Glow orb */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: isHighStreak
            ? "radial-gradient(circle, rgba(255,107,53,0.2), transparent 70%)"
            : "radial-gradient(circle, rgba(0,245,255,0.1), transparent 70%)" }} />

        {/* Flame — tappable even here for consistency */}
        <button
          onClick={() => navigate("/streak")}
          className="leading-none select-none active:scale-90 transition-transform"
          style={{ WebkitTapHighlightColor: "transparent", background: "none", border: "none", padding: 0 }}
        >
          <span
            style={{
              fontSize: isHighStreak ? 96 : 80,
              display: "inline-block",
              filter: isHighStreak
                ? "drop-shadow(0 0 20px #ff6b35) drop-shadow(0 0 40px #ff6b35) drop-shadow(0 0 60px #fb923c)"
                : "drop-shadow(0 0 8px #ff6b35) drop-shadow(0 0 20px #ff6b35)",
              animation: isHighStreak ? "streak-fire 0.7s ease-in-out infinite" : "bounce 1.6s infinite",
            }}
          >
            🔥
          </span>
        </button>

        {/* Counter */}
        <div className="text-center">
          <div
            className="font-black tabular-nums leading-none"
            style={{
              fontSize: streak >= 100 ? 72 : 88,
              color: isHighStreak ? "#fb923c" : "#00f5ff",
              textShadow: isHighStreak ? "0 0 30px rgba(255,107,53,0.6)" : "0 0 20px rgba(0,245,255,0.4)",
            }}
          >
            {streak}
          </div>
          <div className="text-sm font-semibold text-muted-foreground mt-1">
            {streak === 1 ? "day streak" : "day streak"}
          </div>
        </div>

        {/* Motivation */}
        <p className="text-sm font-bold text-center px-8 leading-snug" style={{ color: motColor }}>
          {motMsg}
        </p>

        {/* Fire ring for high streak */}
        {isHighStreak && (
          <div className="flex gap-1">
            {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
              <span key={i} style={{ fontSize: 10, opacity: 0.7 + (i / 20) }}>🔥</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Flash message ── */}
      {msg && (
        <div className="rounded-2xl px-4 py-3 text-sm font-bold text-center"
          style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.3)" }}>
          {msg}
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

      {/* ── 6-week calendar ── */}
      <div className="rounded-3xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Activity (last 6 weeks)</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span style={{ fontSize: 10 }}>🔥</span> Win
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-secondary/60 inline-block" /> Missed
            </span>
          </div>
        </div>

        {/* Day headers Mon–Sun */}
        <div className="grid grid-cols-7 gap-1.5">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        {(() => {
          const firstDay = days[0] ? new Date(days[0]).getDay() : 1;
          const offset = (firstDay + 6) % 7;
          const cells = [...Array(offset).fill(null), ...days];
          const rows = [];
          for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
          return rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 gap-1.5">
              {row.map((day, di) => {
                if (!day) return <div key={di} className="aspect-square" />;
                const status = dayMap[day];
                const isToday = day === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={di} title={day}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center transition-all",
                      status === "win"
                        ? "border border-[#39ff14]/50"
                        : "bg-secondary/40 border border-border",
                      isToday ? "ring-2 ring-[#00f5ff] ring-offset-1 ring-offset-background" : ""
                    )}
                    style={status === "win" ? { background: "rgba(57,255,20,0.18)" } : {}}
                  >
                    {status === "win" && (
                      <span style={{ fontSize: 11, filter: "drop-shadow(0 0 3px #39ff14)" }}>🔥</span>
                    )}
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>

      {/* ── Freeze power-ups ── */}
      <div className="rounded-3xl border p-4 space-y-3"
        style={{ borderColor: "rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00f5ff]" />
          <span className="text-sm font-bold">Streak Freeze Power-Ups</span>
          <span className="ml-auto text-xs font-black" style={{ color: freezes > 0 ? "#00f5ff" : "#ef4444" }}>
            {freezes} left
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Use a freeze to protect your streak on a rest day — no mission needed.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleUseFreeze}
            disabled={freezes <= 0}
            className="py-3 rounded-2xl text-sm font-black text-black transition-all duration-200 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{ background: "#00f5ff", boxShadow: freezes > 0 ? "0 0 18px rgba(0,245,255,0.4)" : "none" }}
          >
            🛡️ Use Freeze
          </button>
          <button
            className="py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95"
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
          <div className="text-xs text-muted-foreground mt-0.5">Missed a day? Restore your streak once.</div>
        </div>
        <button
          onClick={handleRepairStreak}
          className="px-4 py-2 rounded-xl text-xs font-black text-black transition-all active:scale-95"
          style={{ background: "#fb923c", boxShadow: "0 0 12px rgba(251,146,60,0.35)" }}
        >
          Repair
        </button>
      </div>

      {/* ── Recent wins ── */}
      {wins.length > 0 ? (
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
      ) : (
        <div className="rounded-3xl border bg-card p-8 text-center space-y-2">
          <div className="text-4xl">🎯</div>
          <p className="text-sm font-bold">No wins yet</p>
          <p className="text-xs text-muted-foreground">Complete your first mission to start your streak!</p>
        </div>
      )}
    </div>
  );
}