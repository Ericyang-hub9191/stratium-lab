/* ─────────────────────────────────────────────────────────────
   JourneyDetail — shows a single Journey + its lessons in order.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function JourneyDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney]         = useState(null);
  const [lessons, setLessons]         = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [journeys, lessonList, user] = await Promise.all([
          base44.entities.Journey.filter({ slug }),
          base44.entities.Lesson.filter({ journeyId: slug, isPublished: true }),
          base44.auth.me().catch(() => null),
        ]);
        if (cancelled) return;
        setJourney(journeys[0] ?? null);
        setLessons((lessonList ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        if (user) {
          const progress = await base44.entities.UserProgress.filter({
            userId: user.id, contentType: "lesson", journeyId: slug,
          });
          if (!cancelled) setCompletedIds(new Set(progress.filter(p => p.status === "completed").map(p => p.contentId)));
        }
      } catch (e) {
        console.error("JourneyDetail failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" /></div>;
  }
  if (!journey) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">Journey not found.</p>
        <button onClick={() => navigate("/library")} className="btn btn-ghost">Back to library</button>
      </div>
    );
  }

  const completed = lessons.filter(l => completedIds.has(l.id)).length;
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
  const nextLesson = lessons.find(l => !completedIds.has(l.id));

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-7">

      <button onClick={() => navigate(-1)} className="btn btn-quiet !px-0 -ml-1 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <header className="space-y-3">
        <div className="ui-eyebrow">{journey.track} · {journey.difficulty ?? "intro"}</div>
        <h1 className="text-3xl ui-heading">{journey.title}</h1>
        {journey.subtitle && <p className="text-base text-text-secondary leading-relaxed">{journey.subtitle}</p>}
        {journey.summary && <p className="text-sm text-text-secondary leading-relaxed">{journey.summary}</p>}
        <div className="flex items-center gap-4 pt-1 text-xs text-text-muted">
          <span>{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</span>
          {journey.estimatedHours && <span>~{journey.estimatedHours}h total</span>}
          {journey.author && <span>by {journey.author}</span>}
        </div>
      </header>

      {/* Progress + CTA */}
      <div className="rounded-lg border border-border bg-surface-1 p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-text-primary font-medium">
              {completed === 0 ? "Not started"
                : completed === lessons.length ? "Completed"
                : `${completed} of ${lessons.length} complete`}
            </span>
            <span className="text-xs text-text-muted tabular-nums">{pct}%</span>
          </div>
          <div className="h-1 rounded-full bg-surface-inset overflow-hidden">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {nextLesson && (
          <button onClick={() => navigate(`/lesson/${nextLesson.id}`)} className="btn btn-primary shrink-0">
            {completed === 0 ? "Start" : "Continue"}
          </button>
        )}
      </div>

      {/* Lesson list */}
      <ol className="space-y-1.5">
        {lessons.map((l, idx) => {
          const done = completedIds.has(l.id);
          const isNext = !done && l.id === nextLesson?.id;
          return (
            <li key={l.id}>
              <button
                onClick={() => navigate(`/lesson/${l.id}`)}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-colors",
                  done
                    ? "border-border bg-surface-1 hover:border-border-strong"
                    : isNext
                    ? "border-accent bg-[hsla(var(--accent),0.06)] hover:bg-[hsla(var(--accent),0.10)]"
                    : "border-border bg-surface-1 hover:border-border-strong"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium tabular-nums",
                    done ? "bg-success text-bg" : isNext ? "bg-accent text-bg" : "bg-surface-2 text-text-secondary"
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : (l.order ?? idx + 1)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{l.title}</div>
                  {l.subtitle && (
                    <div className="text-xs text-text-secondary mt-0.5 line-clamp-1">{l.subtitle}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-muted">
                    {l.estimatedMinutes && <><Clock className="w-3 h-3" />{l.estimatedMinutes} min</>}
                    <span>·</span>
                    <span>+{l.xpReward} XP</span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}