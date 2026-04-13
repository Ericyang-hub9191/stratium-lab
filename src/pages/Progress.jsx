import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { TrendingUp, Clock, Zap, Award, Lock, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

// ── XP thresholds per level ───────────────────────────────────────────
const XP_PER_LEVEL = 500;
function xpForLevel(lvl) { return lvl * XP_PER_LEVEL; }

// ── Badge definitions ─────────────────────────────────────────────────
const BADGES = [
  { id: "first_win",     emoji: "🎯", label: "First Win",     desc: "Log your first mission win",      threshold: 1,  field: "totalMissionsCompleted" },
  { id: "streak_3",      emoji: "🔥", label: "On Fire",       desc: "3-day streak",                    threshold: 3,  field: "streak" },
  { id: "streak_7",      emoji: "⚡", label: "Week Warrior",  desc: "7-day streak",                    threshold: 7,  field: "streak" },
  { id: "streak_30",     emoji: "💎", label: "Diamond",       desc: "30-day streak",                   threshold: 30, field: "streak" },
  { id: "wins_10",       emoji: "🏆", label: "Win Machine",   desc: "10 total wins",                   threshold: 10, field: "totalMissionsCompleted" },
  { id: "wins_50",       emoji: "🚀", label: "Launched",      desc: "50 total wins",                   threshold: 50, field: "totalMissionsCompleted" },
  { id: "xp_500",        emoji: "🌟", label: "Level 2",       desc: "Reach Level 2",                   threshold: 2,  field: "currentLevel" },
  { id: "xp_1000",       emoji: "🧠", label: "Deep Thinker",  desc: "Reach Level 3",                   threshold: 3,  field: "currentLevel" },
  { id: "time_60",       emoji: "⏱️", label: "Time Wizard",   desc: "Save 60+ minutes",                threshold: 60, field: "totalTimeSaved" },
];

// ── Mastery path nodes ────────────────────────────────────────────────
const PATH_NODES = [
  { id: 1, emoji: "⚡", label: "Quick-Win Starter",   req: 0,  desc: "Complete your first mission"       },
  { id: 2, emoji: "🎯", label: "Prompt Apprentice",   req: 3,  desc: "3 quick-win missions completed"    },
  { id: 3, emoji: "🔥", label: "Streak Igniter",      req: 7,  desc: "Reach a 3-day streak"              },
  { id: 4, emoji: "🧠", label: "Deep Dive Unlocked",  req: 10, desc: "10 wins — deep dives now available" },
  { id: 5, emoji: "🚀", label: "AI Power User",       req: 25, desc: "25 missions completed"             },
  { id: 6, emoji: "💎", label: "Mastery Legend",      req: 50, desc: "50 missions — full mastery"        },
];

function MotivationBanner({ stats, nextBadge }) {
  const { totalXp = 0, currentLevel = 1 } = stats;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const pct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  if (nextBadge) {
    return (
      <p className="text-sm font-bold text-center" style={{ color: "#39ff14" }}>
        🏅 Next badge: <span style={{ color: "#00f5ff" }}>{nextBadge.label}</span> — only {nextBadge.gap} more {nextBadge.unit} away!
      </p>
    );
  }
  return (
    <p className="text-sm font-bold text-center" style={{ color: "#39ff14" }}>
      You're <span style={{ color: "#00f5ff" }}>{pct}%</span> toward Level {currentLevel + 1} — keep going!
    </p>
  );
}

export default function Progress() {
  const { deepDive } = useOutletContext() || {};

  const [stats,   setStats]   = useState({});
  const [streak,  setStreak]  = useState(0);
  const [wins,    setWins]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const [statsArr, streakArr, winArr] = await Promise.all([
          base44.entities.UserStats.filter({ userId: user.id }),
          base44.entities.Streak.filter({ userId: user.id }),
          base44.entities.WinLog.filter({ userId: user.id }, "-created_date", 100),
        ]);
        setStats(statsArr[0] ?? {});
        setStreak(streakArr[0]?.currentStreak ?? 0);
        setWins(winArr);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
      </div>
    );
  }

  const totalXp       = stats.totalXp              ?? 0;
  const currentLevel  = stats.currentLevel         ?? 1;
  const totalMissions = stats.totalMissionsCompleted ?? 0;
  const totalTime     = stats.totalTimeSaved        ?? 0;

  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const xpPct       = Math.min(Math.round((xpIntoLevel / XP_PER_LEVEL) * 100), 100);

  // ── Which badges are earned ───────────────────────────────────────
  const fieldVal = { streak, totalMissionsCompleted: totalMissions, currentLevel, totalTimeSaved: totalTime };
  const earnedIds = new Set(BADGES.filter(b => (fieldVal[b.field] ?? 0) >= b.threshold).map(b => b.id));

  // ── Next un-earned badge ──────────────────────────────────────────
  const nextBadgeData = (() => {
    const unearned = BADGES.filter(b => !earnedIds.has(b.id));
    if (!unearned.length) return null;
    const b = unearned[0];
    const gap = b.threshold - (fieldVal[b.field] ?? 0);
    const unitMap = { streak: "streak days", totalMissionsCompleted: "wins", currentLevel: "levels", totalTimeSaved: "minutes saved" };
    return { ...b, gap, unit: unitMap[b.field] };
  })();

  // ── Category XP breakdown (only in Deep Dive mode) ───────────────
  const categoryXp = stats.categoryXp ?? {};
  const catEntries = Object.entries(categoryXp).sort((a, b) => b[1] - a[1]);

  // ── Mastery path progress ─────────────────────────────────────────
  const activeNode = PATH_NODES.filter(n => totalMissions >= n.req).slice(-1)[0] ?? PATH_NODES[0];

  const timeDisplay = totalTime >= 60
    ? `${(totalTime / 60).toFixed(1)} hrs`
    : `${totalTime} min`;

  return (
    <div className="px-4 py-6 space-y-6 pb-24">

      {/* ── Level card ── */}
      <div
        className="rounded-3xl border p-5 space-y-4 relative overflow-hidden"
        style={{
          borderColor: "rgba(57,255,20,0.3)",
          background: "linear-gradient(135deg, rgba(57,255,20,0.06), rgba(0,245,255,0.03))",
        }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(57,255,20,0.12), transparent 70%)" }} />

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current Level</p>
            <div className="text-7xl font-black leading-none mt-1" style={{ color: "#39ff14" }}>
              {currentLevel}
            </div>
          </div>
          <div className="text-right pb-1">
            <p className="text-xs text-muted-foreground">Total XP</p>
            <div className="text-4xl font-black tabular-nums" style={{ color: "#00f5ff" }}>{totalXp}</div>
          </div>
        </div>

        {/* XP progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
            <span className="font-semibold">{xpIntoLevel} XP</span>
            <span className="font-semibold text-[#39ff14]">{xpPct}% to Level {currentLevel + 1}</span>
            <span>{XP_PER_LEVEL} XP</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${xpPct}%`,
                background: "linear-gradient(90deg, #39ff14, #00f5ff)",
                boxShadow: "0 0 8px rgba(57,255,20,0.5)",
              }}
            />
          </div>
        </div>

        <MotivationBanner stats={stats} nextBadge={nextBadgeData} />
      </div>

      {/* ── Lifetime impact stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Zap,       label: "Lifetime XP",    value: String(totalXp),       color: "#00f5ff" },
          { icon: Clock,     label: "Time Saved",     value: timeDisplay,           color: "#39ff14" },
          { icon: TrendingUp,label: "Total Missions", value: String(totalMissions), color: "#a78bfa" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border bg-card p-3 text-center space-y-1.5">
            <Icon className="w-5 h-5 mx-auto" style={{ color }} />
            <div className="text-xl font-black" style={{ color }}>{value}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Deep Dive: Category XP breakdown ── */}
      {deepDive && catEntries.length > 0 && (
        <div className="rounded-3xl border bg-card p-4 space-y-3"
          style={{ borderColor: "rgba(167,139,250,0.3)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#a78bfa]">🔬 Category Mastery</span>
          </div>
          {catEntries.map(([cat, xp], i) => {
            const maxXp = catEntries[0][1];
            const pct = Math.round((xp / maxXp) * 100);
            const colors = ["#00f5ff","#39ff14","#a78bfa","#fb923c","#f472b6"];
            const color = colors[i % colors.length];
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="capitalize">{cat}</span>
                  <span style={{ color }}>{xp} XP</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Mastery path ── */}
      <div className="rounded-3xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#fb923c]" />
          <span className="text-sm font-bold">Mastery Path</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{totalMissions} missions done</span>
        </div>
        <div className="space-y-3">
          {PATH_NODES.map((node, i) => {
            const unlocked = totalMissions >= node.req;
            const isActive = activeNode?.id === node.id;
            return (
              <div key={node.id} className="flex items-center gap-3">
                {/* Connector line */}
                <div className="flex flex-col items-center self-stretch shrink-0" style={{ width: 32 }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all duration-300"
                    style={
                      isActive
                        ? { borderColor: "#00f5ff", background: "rgba(0,245,255,0.15)", boxShadow: "0 0 12px rgba(0,245,255,0.4)" }
                        : unlocked
                        ? { borderColor: "#39ff14", background: "rgba(57,255,20,0.12)" }
                        : { borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))", opacity: 0.4 }
                    }
                  >
                    {unlocked ? node.emoji : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  {i < PATH_NODES.length - 1 && (
                    <div
                      className="w-0.5 flex-1 mt-1"
                      style={{ background: unlocked ? "rgba(57,255,20,0.3)" : "hsl(var(--border))" }}
                    />
                  )}
                </div>
                <div className={cn("flex-1 pb-3", i === PATH_NODES.length - 1 && "pb-0")}>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: isActive ? "#00f5ff" : unlocked ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    >
                      {node.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-black bg-[#00f5ff]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{node.desc}</p>
                  {!unlocked && (
                    <p className="text-[10px] mt-0.5" style={{ color: "#fb923c" }}>
                      🔒 {node.req - totalMissions} more missions to unlock
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Badges gallery ── */}
      <div className="rounded-3xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Power-Up Badges</span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {earnedIds.size} / {BADGES.length} earned
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300"
                style={
                  earned
                    ? { borderColor: "rgba(57,255,20,0.4)", background: "rgba(57,255,20,0.06)", boxShadow: "0 0 10px rgba(57,255,20,0.1)" }
                    : { borderColor: "hsl(var(--border))", opacity: 0.4 }
                }
              >
                <span className={cn("text-3xl", !earned && "grayscale")}>{badge.emoji}</span>
                <span className={cn("text-[10px] font-bold text-center leading-tight", !earned && "text-muted-foreground")}>
                  {badge.label}
                </span>
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{badge.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}