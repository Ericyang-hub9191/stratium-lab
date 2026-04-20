/* ─────────────────────────────────────────────────────────────
   Streak — the one page where the flame lives.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

function streakCopy(s) {
  if (s === 0) return "No streak yet. Complete one lesson or boost today to start.";
  if (s === 1) return "Day one. Come back tomorrow to make it two.";
  if (s < 7)   return `${s} days. Come back tomorrow to keep it.`;
  if (s < 30)  return `${s} days. You've made this a habit.`;
  return `${s} days. This is who you are now.`;
}

function buildHeatmap(progressRecords, daysBack = 84) {
  const map = new Map();
  const today = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    map.set(d.toISOString().split("T")[0], 0);
  }
  progressRecords.forEach(p => {
    if (p.status !== "completed") return;
    const day = (p.completedAt ?? "").split("T")[0];
    if (day && map.has(day)) map.set(day, (map.get(day) ?? 0) + 1);
  });
  return Array.from(map.entries()).reverse();
}

export default function Streak() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await base44.auth.me();
        const [streakArr, progress] = await Promise.all([
          base44.entities.Streak.filter({ userId: user.id }),
          base44.entities.UserProgress.filter({ userId: user.id }),
        ]);
        if (cancelled) return;
        setStreak(streakArr[0] ?? null);
        setHeatmap(buildHeatmap(progress, 84));
      } catch (e) {
        console.error("Streak load failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" /></div>;
  }

  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const totalDays = streak?.totalCompletedDays ?? 0;
  const freezes = streak?.freezeCount ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">

      <button onClick={() => navigate(-1)} className="btn btn-quiet !px-0 -ml-1 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center pt-4 pb-2">
        <div className="text-7xl md:text-8xl leading-none mb-4 select-none" style={{ filter: current > 0 ? "drop-shadow(0 0 18px hsla(var(--streak), 0.45))" : "grayscale(1) opacity(0.4)" }}>
          🔥
        </div>
        <div className="text-5xl md:text-6xl font-medium tabular-nums text-text-primary" style={{ letterSpacing: "-0.03em" }}>
          {current}
        </div>
        <div className="text-sm text-text-secondary mt-1">{current === 1 ? "day" : "days"}</div>
        <p className="text-sm text-text-secondary mt-5 max-w-sm mx-auto leading-relaxed">{streakCopy(current)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Longest" value={longest} suffix="days" />
        <Stat label="Total active days" value={totalDays} suffix="" />
        <Stat label="Freezes" value={freezes} suffix="" icon={<Shield className="w-3 h-3" />} />
      </div>

      <section>
        <h3 className="text-sm ui-heading text-text-primary mb-3">Last 12 weeks</h3>
        <div className="rounded-lg border border-border bg-surface-1 p-4">
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {heatmap.map(([date, count]) => (
              <div
                key={date}
                title={`${date} — ${count} completion${count === 1 ? "" : "s"}`}
                className="w-2.5 h-2.5 rounded-[2px]"
                style={{
                  background: count === 0
                    ? "hsl(var(--surface-inset))"
                    : count === 1 ? "hsla(var(--accent), 0.4)"
                    : count === 2 ? "hsla(var(--accent), 0.7)"
                    : "hsl(var(--accent))",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-text-muted">
            <span>Less</span>
            {[0, 1, 2, 3].map(n => (
              <div
                key={n}
                className="w-2.5 h-2.5 rounded-[2px]"
                style={{
                  background: n === 0
                    ? "hsl(var(--surface-inset))"
                    : n === 1 ? "hsla(var(--accent), 0.4)"
                    : n === 2 ? "hsla(var(--accent), 0.7)"
                    : "hsl(var(--accent))",
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-border bg-surface-1 p-4 text-xs text-text-secondary leading-relaxed">
        <strong className="text-text-primary font-medium">How streaks work.</strong> One streak day = at least one lesson or boost completed.
        Freezes protect a missed day. They aren't gifted — you earn one for every 7 consecutive days.
      </div>
    </div>
  );
}

function Stat({ label, value, suffix, icon }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-3 text-center">
      <div className="text-xs text-text-muted flex items-center justify-center gap-1.5 mb-1.5">
        {icon}<span>{label}</span>
      </div>
      <div className="text-xl font-medium text-text-primary tabular-nums">{value}</div>
      {suffix && <div className="text-[10px] text-text-muted mt-0.5">{suffix}</div>}
    </div>
  );
}