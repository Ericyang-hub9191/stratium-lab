/* ─────────────────────────────────────────────────────────────
   Progress — real stats from the new entities.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { levelFromXp } from "@/lib/progress-utils";

export default function Progress() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [recent, setRecent]   = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await base44.auth.me();
        const [statsArr, progress] = await Promise.all([
          base44.entities.UserStats.filter({ userId: user.id }),
          base44.entities.UserProgress.filter({ userId: user.id }),
        ]);
        if (cancelled) return;
        setStats(statsArr[0] ?? null);

        const completed = progress
          .filter(p => p.status === "completed")
          .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

        const recentSlice = completed.slice(0, 8);
        const hydrated = await Promise.all(recentSlice.map(async p => {
          try {
            const items = await base44.entities[p.contentType === "lesson" ? "Lesson" : "Boost"].filter({ id: p.contentId });
            return { ...p, title: items[0]?.title ?? "(deleted)", _meta: items[0] };
          } catch {
            return { ...p, title: "(unknown)" };
          }
        }));
        if (!cancelled) setRecent(hydrated);

        const journeyIds = [...new Set(progress.filter(p => p.contentType === "lesson" && p.journeyId).map(p => p.journeyId))];
        const journeyData = await Promise.all(journeyIds.map(async slug => {
          const [j, lessons] = await Promise.all([
            base44.entities.Journey.filter({ slug }),
            base44.entities.Lesson.filter({ journeyId: slug, isPublished: true }),
          ]);
          if (!j[0]) return null;
          const completedInJ = progress.filter(p => p.journeyId === slug && p.status === "completed").length;
          return { ...j[0], completed: completedInJ, total: lessons.length };
        }));
        if (!cancelled) setJourneys(journeyData.filter(Boolean));
      } catch (e) {
        console.error("Progress load failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" /></div>;
  }

  const totalXp = stats?.totalXp ?? 0;
  const { level, xpIntoLevel, xpForNext } = levelFromXp(totalXp);
  const pct = xpForNext > 0 ? Math.round((xpIntoLevel / xpForNext) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">

      <div className="space-y-1">
        <div className="ui-eyebrow">Progress</div>
        <h1 className="text-2xl md:text-3xl ui-heading">Your work</h1>
      </div>

      <div className="rounded-lg border border-border-strong bg-surface-1 p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <div>
            <div className="ui-eyebrow !text-text-muted mb-1">Level</div>
            <div className="text-4xl md:text-5xl font-medium text-text-primary tabular-nums" style={{ letterSpacing: "-0.02em" }}>
              {level}
            </div>
          </div>
          <div className="text-right">
            <div className="ui-eyebrow !text-text-muted mb-1">Total XP</div>
            <div className="text-2xl font-medium text-text-primary tabular-nums">{totalXp.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-baseline justify-between text-xs text-text-secondary mb-1.5">
          <span>{xpIntoLevel} / {xpForNext} XP to L{level + 1}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-surface-inset overflow-hidden">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Counter label="Lessons" value={stats?.totalLessonsCompleted ?? 0} />
        <Counter label="Boosts" value={stats?.totalBoostsCompleted ?? 0} />
        <Counter label="Journeys" value={stats?.totalJourneysCompleted ?? 0} />
      </div>

      {journeys.length > 0 && (
        <section>
          <h3 className="text-sm ui-heading text-text-primary mb-3">Journeys</h3>
          <div className="space-y-2">
            {journeys.map(j => {
              const p = j.total > 0 ? Math.round((j.completed / j.total) * 100) : 0;
              return (
                <div
                  key={j.slug}
                  onClick={() => navigate(`/journey/${j.slug}`)}
                  className="cursor-pointer rounded-lg border border-border bg-surface-1 p-4 hover:border-border-strong transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <div className="text-sm font-medium text-text-primary truncate">{j.title}</div>
                    <div className="text-xs text-text-secondary tabular-nums shrink-0">{j.completed} / {j.total}</div>
                  </div>
                  <div className="h-1 rounded-full bg-surface-inset overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm ui-heading text-text-primary mb-3">Recently completed</h3>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-1 p-6 text-center text-sm text-text-secondary">
            Nothing yet. Complete a lesson or boost to see it here.
          </div>
        ) : (
          <ol className="space-y-1.5">
            {recent.map(r => (
              <li key={r.id}>
                <button
                  onClick={() => navigate(r.contentType === "lesson" ? `/lesson/${r.contentId}` : `/boost/${r.contentId}`)}
                  className="w-full text-left flex items-baseline justify-between gap-4 px-3.5 py-2.5 rounded-lg border border-border bg-surface-1 hover:border-border-strong transition-colors"
                >
                  <div className="min-w-0">
                    <div className="ui-eyebrow !text-text-muted">{r.contentType === "lesson" ? "Lesson" : "Boost"}</div>
                    <div className="text-sm text-text-primary truncate">{r.title}</div>
                  </div>
                  <div className="text-xs text-text-muted shrink-0 text-right">
                    <div>+{r.xpAwarded ?? 0} XP</div>
                    <div className="mt-0.5">
                      {r.completedAt && new Date(r.completedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Counter({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-3 text-center">
      <div className="text-xl font-medium text-text-primary tabular-nums">{value}</div>
      <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
    </div>
  );
}