import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateStreak, updateUserStatsForLesson } from "@/lib/progress-utils";
import Block, { allRequiredChecksPassed } from "@/components/blocks";

export default function LessonExperience() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson]         = useState(null);
  const [journey, setJourney]       = useState(null);
  const [progress, setProgress]     = useState(null);
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lessonResults, currentUser] = await Promise.all([
          base44.entities.Lesson.filter({ id }),
          base44.auth.me().catch(() => null),
        ]);
        if (cancelled) return;
        const lessonRec = lessonResults[0] ?? null;
        setLesson(lessonRec);
        setUser(currentUser);

        if (lessonRec?.journeyId) {
          const journeyResults = await base44.entities.Journey.filter({ slug: lessonRec.journeyId });
          if (!cancelled) setJourney(journeyResults[0] ?? null);
        }

        if (currentUser && lessonRec) {
          const existing = await base44.entities.UserProgress.filter({
            userId: currentUser.id, contentId: lessonRec.id, contentType: "lesson",
          });
          if (existing[0]) {
            if (!cancelled) setProgress(existing[0]);
          } else {
            const created = await base44.entities.UserProgress.create({
              userId: currentUser.id, contentId: lessonRec.id, contentType: "lesson",
              journeyId: lessonRec.journeyId, status: "in-progress",
              checkAnswers: {}, practiceEntries: {}, writeEntries: {},
              startedAt: new Date().toISOString(), xpAwarded: 0,
            });
            if (!cancelled) setProgress(created);
          }
        }
      } catch (e) { console.error("Failed to load lesson:", e); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const persistTimer = useRef(null);
  const handleProgressUpdate = (partial) => {
    setProgress(prev => {
      const next = { ...prev, ...partial };
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        if (next.id) base44.entities.UserProgress.update(next.id, partial).catch(() => {});
      }, 600);
      return next;
    });
  };

  const canComplete = useMemo(() => {
    if (!lesson || !progress) return false;
    if (progress.status === "completed") return false;
    return allRequiredChecksPassed(lesson.blocks ?? [], progress);
  }, [lesson, progress]);

  const isCompleted = progress?.status === "completed";

  const handleComplete = async () => {
    if (!canComplete || !user || !lesson || completing) return;
    setCompleting(true);
    const timeSpent = Math.round((Date.now() - startedAtRef.current) / 1000);
    try {
      await Promise.all([
        base44.entities.UserProgress.update(progress.id, {
          status: "completed", completedAt: new Date().toISOString(),
          xpAwarded: lesson.xpReward ?? 0,
          timeSpentSeconds: (progress.timeSpentSeconds ?? 0) + timeSpent,
        }),
        updateStreak(user.id),
        updateUserStatsForLesson(user.id, lesson.xpReward ?? 0),
      ]);
      window.dispatchEvent(new CustomEvent("progress-updated"));
      setProgress(p => ({ ...p, status: "completed", completedAt: new Date().toISOString(), xpAwarded: lesson.xpReward ?? 0 }));
    } catch (e) { console.error("Complete failed:", e); }
    finally { setCompleting(false); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" /></div>;
  }
  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-bg">
        <p className="text-text-secondary">Lesson not found.</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">Go back</button>
      </div>
    );
  }

  const requiredChecks = (lesson.blocks ?? []).filter(b => b.type === "check" && b.required !== false);
  const answeredChecks = requiredChecks.filter(b => progress?.checkAnswers?.[b.id]?.correct === true).length;
  const hasChecks      = requiredChecks.length > 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost !py-1.5 !px-2.5" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            {journey && <div className="text-[11px] font-medium text-text-muted truncate">{journey.title}{lesson.order ? ` · Lesson ${lesson.order}` : ""}</div>}
            <div className="text-sm font-medium text-text-primary truncate">{lesson.title}</div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-text-secondary">
            {lesson.estimatedMinutes && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.estimatedMinutes} min</span>}
            {hasChecks && <span>{answeredChecks}/{requiredChecks.length} checks</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 reading-surface py-10 md:py-14 px-4 md:px-8 animate-fade-in">
        <article className="max-w-2xl mx-auto space-y-6 pb-32">
          <header className="space-y-3 pb-4 mb-2 border-b" style={{ borderColor: "hsl(var(--reading-border))" }}>
            {journey && <div className="eyebrow">{journey.title}{lesson.order ? ` · Lesson ${lesson.order}` : ""}</div>}
            <h1 className="!mt-0">{lesson.title}</h1>
            {lesson.subtitle && <p className="text-[1.15em] muted !mt-1" style={{ lineHeight: 1.5 }}>{lesson.subtitle}</p>}
          </header>
          {(lesson.blocks ?? []).map(block => (
            <Block key={block.id} block={block} progress={progress} onProgress={handleProgressUpdate} />
          ))}
        </article>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border backdrop-blur-xl" style={{ background: "hsla(var(--bg), 0.92)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3.5 flex items-center gap-4">
          <div className="flex-1 text-xs text-text-secondary">
            {isCompleted ? (
              <span className="flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Completed · +{progress?.xpAwarded ?? lesson.xpReward} XP</span>
            ) : hasChecks && !canComplete ? (
              <span>Answer {requiredChecks.length - answeredChecks} more check{requiredChecks.length - answeredChecks === 1 ? "" : "s"} to complete this lesson.</span>
            ) : canComplete ? (
              <span className="text-text-primary">All checks passed. Ready to mark complete.</span>
            ) : (
              <span>No checks in this lesson — mark complete when you're done reading.</span>
            )}
          </div>
          <button onClick={handleComplete} disabled={!canComplete || completing || isCompleted} className="btn btn-primary">
            {isCompleted ? <><Check className="w-4 h-4" /> Completed</>
              : completing ? "Saving…"
              : `Mark complete · +${lesson.xpReward} XP`}
          </button>
        </div>
      </div>
    </div>
  );
}