/* ─────────────────────────────────────────────────────────────
   LessonExperience — core reader/runner for a Lesson.

   Flow:
   1. Fetch Lesson by id.
   2. Fetch/create UserProgress for this user + lesson.
   3. Render lesson body on the reading surface (serif, lighter).
   4. Render each block via the block router.
   5. "Mark complete" is disabled until all required checks
      have been answered correctly.
   6. On completion: update UserStats, update Streak, mark
      progress completedAt — then transition into the
      CompletionScreen, which presents four outward actions
      (continue / back to journey / take a boost / home).

   Completion is quiet. No confetti. One clean state change.
   Confetti is reserved for journey completion (not yet built).
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Check, ArrowRight, Home as HomeIcon, BookOpen, Zap } from "lucide-react";
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
  // After a successful "Mark complete" we show a completion screen
  // in place of the lesson body. Tracks whether the user just completed.
  const [justCompleted, setJustCompleted] = useState(false);
  const [nextLesson, setNextLesson]             = useState(null);
  const [recommendedBoost, setRecommendedBoost] = useState(null);
  const startedAtRef = useRef(Date.now());

  // ── Load lesson, journey, and progress ────────────────────
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
            userId: currentUser.id,
            contentId: lessonRec.id,
            contentType: "lesson",
          });
          if (existing[0]) {
            if (!cancelled) setProgress(existing[0]);
          } else {
            const created = await base44.entities.UserProgress.create({
              userId: currentUser.id,
              contentId: lessonRec.id,
              contentType: "lesson",
              journeyId: lessonRec.journeyId,
              status: "in-progress",
              checkAnswers: {},
              practiceEntries: {},
              writeEntries: {},
              startedAt: new Date().toISOString(),
              xpAwarded: 0,
            });
            if (!cancelled) setProgress(created);
          }
        }
      } catch (e) {
        console.error("Failed to load lesson:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Persist progress updates (debounced fire-and-forget) ─
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

  // ── Preload the "what's next?" options for the completion screen ─
  const loadCompletionTargets = async () => {
    if (!lesson || !user) return;
    try {
      if (lesson.journeyId) {
        const sibling = await base44.entities.Lesson.filter({
          journeyId: lesson.journeyId,
          isPublished: true,
        });
        const sorted = (sibling ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const next = sorted.find(l => (l.order ?? 0) > (lesson.order ?? 0));
        setNextLesson(next ?? null);
      }
      const [allBoosts, allProgress, stats] = await Promise.all([
        base44.entities.Boost.filter({ isPublished: true }),
        base44.entities.UserProgress.filter({ userId: user.id, contentType: "boost" }),
        base44.entities.UserStats.filter({ userId: user.id }),
      ]);
      const completedBoostIds = new Set(
        allProgress.filter(p => p.status === "completed").map(p => p.contentId)
      );
      const availableBoosts = allBoosts.filter(b => !completedBoostIds.has(b.id));
      const tracks = stats[0]?.favoriteTracks ?? [];
      const preferred = tracks.length
        ? availableBoosts.filter(b => tracks.includes(b.category))
        : availableBoosts;
      setRecommendedBoost(preferred[0] ?? availableBoosts[0] ?? null);
    } catch (e) {
      console.error("loadCompletionTargets failed:", e);
    }
  };

  const handleComplete = async () => {
    if (!canComplete || !user || !lesson || completing) return;
    setCompleting(true);
    const timeSpent = Math.round((Date.now() - startedAtRef.current) / 1000);
    try {
      await Promise.all([
        base44.entities.UserProgress.update(progress.id, {
          status:      "completed",
          completedAt: new Date().toISOString(),
          xpAwarded:   lesson.xpReward ?? 0,
          timeSpentSeconds: (progress.timeSpentSeconds ?? 0) + timeSpent,
        }),
        updateStreak(user.id),
        updateUserStatsForLesson(user.id, lesson.xpReward ?? 0),
      ]);
      window.dispatchEvent(new CustomEvent("progress-updated"));
      setProgress(p => ({
        ...p,
        status: "completed",
        completedAt: new Date().toISOString(),
        xpAwarded: lesson.xpReward ?? 0,
      }));
      await loadCompletionTargets();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setJustCompleted(true);
    } catch (e) {
      console.error("Complete failed:", e);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-bg">
        <p className="text-text-secondary">Lesson not found.</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">Go back</button>
      </div>
    );
  }

  // ── Completion screen (shown in place of the lesson after finishing) ─
  if (justCompleted) {
    return (
      <CompletionScreen
        lesson={lesson}
        journey={journey}
        progress={progress}
        nextLesson={nextLesson}
        recommendedBoost={recommendedBoost}
        navigate={navigate}
      />
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
            {journey && (
              <div className="text-[11px] font-medium text-text-muted truncate">
                {journey.title}{lesson.order ? ` · Lesson ${lesson.order}` : ""}
              </div>
            )}
            <div className="text-sm font-medium text-text-primary truncate">{lesson.title}</div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-text-secondary">
            {lesson.estimatedMinutes && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.estimatedMinutes} min</span>
            )}
            {hasChecks && (
              <span>{answeredChecks}/{requiredChecks.length} checks</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 reading-surface py-10 md:py-14 px-4 md:px-8 animate-fade-in">
        <article className="max-w-2xl mx-auto space-y-6 pb-32">
          <header className="space-y-3 pb-4 mb-2 border-b" style={{ borderColor: "hsl(var(--reading-border))" }}>
            {journey && (
              <div className="eyebrow">
                {journey.title}{lesson.order ? ` · Lesson ${lesson.order}` : ""}
              </div>
            )}
            <h1 className="!mt-0">{lesson.title}</h1>
            {lesson.subtitle && (
              <p className="text-[1.15em] muted !mt-1" style={{ lineHeight: 1.5 }}>{lesson.subtitle}</p>
            )}
          </header>

          {(lesson.blocks ?? []).map(block => (
            <Block
              key={block.id}
              block={block}
              progress={progress}
              onProgress={handleProgressUpdate}
            />
          ))}
        </article>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border backdrop-blur-xl"
        style={{ background: "hsla(var(--bg), 0.92)" }}
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3.5 flex items-center gap-4">
          {hasChecks ? (
            <div className="flex-1 text-xs text-text-secondary">
              {isCompleted ? (
                <span className="flex items-center gap-1.5 text-success">
                  <Check className="w-3.5 h-3.5" /> Completed · +{progress?.xpAwarded ?? lesson.xpReward} XP
                </span>
              ) : canComplete ? (
                <span className="text-text-primary">All checks passed. Ready to mark complete.</span>
              ) : (
                <span>Answer {requiredChecks.length - answeredChecks} more check{requiredChecks.length - answeredChecks === 1 ? "" : "s"} to complete this lesson.</span>
              )}
            </div>
          ) : (
            <div className="flex-1 text-xs text-text-secondary">
              {isCompleted
                ? <span className="flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Completed · +{progress?.xpAwarded ?? lesson.xpReward} XP</span>
                : <span>No checks in this lesson — mark complete when you're done reading.</span>
              }
            </div>
          )}

          <button
            onClick={handleComplete}
            disabled={!canComplete || completing || isCompleted}
            className="btn btn-primary"
          >
            {isCompleted ? <><Check className="w-4 h-4" /> Completed</>
              : completing ? "Saving…"
              : `Mark complete · +${lesson.xpReward} XP`}
          </button>
        </div>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CompletionScreen — shown after a lesson is marked complete.
//
// Four outward actions in priority order:
//   1. Continue to next lesson (primary, if one exists in the journey)
//   2. Back to the journey (to see overall progress)
//   3. Take a 3-minute boost (if one is recommended)
//   4. Back to home
//
// Recaps: XP earned, first-try vs after-retries performance on checks.
// ═══════════════════════════════════════════════════════════
function CompletionScreen({ lesson, journey, progress, nextLesson, recommendedBoost, navigate }) {
  const checkStats = useMemo(() => {
    const required = (lesson.blocks ?? []).filter(b => b.type === "check" && b.required !== false);
    let firstTry = 0, needed = 0;
    for (const c of required) {
      const a = progress?.checkAnswers?.[c.id];
      if (!a?.correct) continue;
      if (a.attempts === 1) firstTry++;
      else needed++;
    }
    return { total: required.length, firstTry, needed };
  }, [lesson, progress]);

  const xpEarned = progress?.xpAwarded ?? lesson.xpReward ?? 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16 animate-fade-in">
      <div className="w-full max-w-md space-y-8">

        {/* Recognition */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "hsla(152, 45%, 55%, 0.12)" }}>
            <Check className="w-5 h-5" style={{ color: "hsl(152, 45%, 45%)" }} />
          </div>
          <div>
            <div className="ui-eyebrow mb-1">Lesson complete</div>
            <h1 className="text-2xl ui-heading">{lesson.title}</h1>
            {journey && (
              <p className="text-sm text-text-secondary mt-1">{journey.title}{lesson.order ? ` · Lesson ${lesson.order}` : ""}</p>
            )}
          </div>
        </div>

        {/* Recap */}
        <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Earned</span>
            <span className="text-sm font-medium text-text-primary tabular-nums">+{xpEarned} XP</span>
          </div>
          {checkStats.total > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Checkpoints</span>
              <span className="text-sm font-medium text-text-primary">
                {checkStats.firstTry}/{checkStats.total} first try
                {checkStats.needed > 0 && (
                  <span className="text-text-muted font-normal">
                    {" "}· {checkStats.needed} after retries
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Next actions */}
        <div className="space-y-2">
          {nextLesson && (
            <button
              onClick={() => navigate(`/lesson/${nextLesson.id}`)}
              className="w-full rounded-lg border border-accent bg-[hsla(var(--accent),0.1)] hover:bg-[hsla(var(--accent),0.15)] transition-colors p-4 text-left flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-md bg-[hsla(var(--accent),0.2)] flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-accent uppercase tracking-wider mb-0.5">Continue</div>
                <div className="text-sm font-medium text-text-primary truncate">{nextLesson.title}</div>
                {nextLesson.estimatedMinutes && (
                  <div className="text-[11px] text-text-muted mt-0.5">{nextLesson.estimatedMinutes} min · +{nextLesson.xpReward} XP</div>
                )}
              </div>
            </button>
          )}

          {journey && (
            <button
              onClick={() => navigate(`/journey/${journey.slug}`)}
              className="w-full rounded-lg border border-border bg-surface-1 hover:border-border-strong transition-colors p-4 text-left flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">Back to journey</div>
                <div className="text-[11px] text-text-muted mt-0.5 truncate">See your progress in {journey.title}</div>
              </div>
            </button>
          )}

          {recommendedBoost && (
            <button
              onClick={() => navigate(`/boost/${recommendedBoost.id}?source=lesson_completion`)}
              className="w-full rounded-lg border border-border bg-surface-1 hover:border-border-strong transition-colors p-4 text-left flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">Take a 3-minute boost</div>
                <div className="text-[11px] text-text-muted mt-0.5 truncate">{recommendedBoost.title}</div>
              </div>
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="w-full rounded-lg border border-border bg-surface-1 hover:border-border-strong transition-colors p-4 text-left flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center shrink-0">
              <HomeIcon className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">Back to home</div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
