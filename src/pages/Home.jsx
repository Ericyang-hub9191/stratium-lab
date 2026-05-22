/* ─────────────────────────────────────────────────────────────
   Home — first impression.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, BookOpen, Zap, Radio, ChevronRight, Repeat } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OnboardingModal from "@/components/OnboardingModal";
import { trackEvent } from "@/lib/analytics";
import { applyBoostListContentOverrides } from "@/lib/content-overrides";

export default function Home() {
  const navigate = useNavigate();

  const [user, setUser]                           = useState(null);
  const [stats, setStats]                         = useState(null);
  const [nextLesson, setNextLesson]               = useState(null);
  const [nextLessonJourney, setNextLessonJourney] = useState(null);
  const [recommendedBoost, setRecommendedBoost]   = useState(null);
  const [reviewableBoost, setReviewableBoost]     = useState(null);
  const [activeJourneys, setActiveJourneys]       = useState([]);
  const [todaySignal, setTodaySignal]             = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [showOnboarding, setShowOnboarding]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (cancelled) return;
        setUser(u);

        const [statsArr, streakArr, progressArr, signals] = await Promise.all([
          base44.entities.UserStats.filter({ userId: u.id }),
          base44.entities.Streak.filter({ userId: u.id }),
          base44.entities.UserProgress.filter({ userId: u.id }),
          base44.entities.Signal.list("-date", 1).catch(() => []),
        ]);
        if (cancelled) return;

        const userStats = statsArr[0];
        setStats(userStats);
        setTodaySignal(signals[0] ?? null);

        if (!userStats) setShowOnboarding(true);

        const completedLessonIds = new Set(
          progressArr.filter(p => p.contentType === "lesson" && p.status === "completed").map(p => p.contentId)
        );
        const inProgressJourneyIds = new Set(
          progressArr.filter(p => p.contentType === "lesson" && p.journeyId).map(p => p.journeyId)
        );

        let journeys = await base44.entities.Journey.filter({ isPublished: true });
        const activeWithProgress = await Promise.all(
          journeys
            .filter(j => inProgressJourneyIds.has(j.slug))
            .map(async j => {
              const lessons = await base44.entities.Lesson.filter({ journeyId: j.slug, isPublished: true });
              const completed = lessons.filter(l => completedLessonIds.has(l.id)).length;
              return { ...j, completed, total: lessons.length, lessons };
            })
        );
        if (cancelled) return;
        setActiveJourneys(activeWithProgress.filter(j => j.completed < j.total));

        let nextL = null, nextJ = null;
        for (const j of activeWithProgress) {
          const sortedLessons = j.lessons.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const next = sortedLessons.find(l => !completedLessonIds.has(l.id));
          if (next) { nextL = next; nextJ = j; break; }
        }
        if (!nextL) {
          const tracks = userStats?.favoriteTracks ?? [];
          const filtered = tracks.length ? journeys.filter(j => tracks.includes(j.track)) : journeys;
          const starter = filtered[0] ?? journeys[0];
          if (starter) {
            const lessons = await base44.entities.Lesson.filter({ journeyId: starter.slug, isPublished: true });
            const sorted = lessons.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            nextL = sorted[0] ?? null;
            nextJ = starter;
          }
        }
        if (cancelled) return;
        setNextLesson(nextL);
        setNextLessonJourney(nextJ);

        const completedBoostIds = new Set(
          progressArr.filter(p => p.contentType === "boost" && p.status === "completed").map(p => p.contentId)
        );
        const boosts = applyBoostListContentOverrides(await base44.entities.Boost.filter({ isPublished: true }));
        const tracks = userStats?.favoriteTracks ?? [];
        const filteredBoosts = boosts.filter(b => !completedBoostIds.has(b.id));
        const matching = tracks.length ? filteredBoosts.filter(b => tracks.includes(b.category)) : filteredBoosts;
        if (!cancelled) setRecommendedBoost(matching[0] ?? filteredBoosts[0] ?? null);

        // Reviewable boost: completed 3+ days ago, has review content, not reviewed in last 7 days
        const now = Date.now();
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        const completedBoostProgress = progressArr.filter(
          p => p.contentType === "boost" && p.status === "completed" && p.completedAt
        );
        const reviewable = completedBoostProgress
          .filter(p => {
            const completedAt = Date.parse(p.completedAt);
            if (!Number.isFinite(completedAt)) return false;
            if (now - completedAt < THREE_DAYS) return false;
            if (p.lastReviewedAt) {
              const lastReview = Date.parse(p.lastReviewedAt);
              if (Number.isFinite(lastReview) && now - lastReview < SEVEN_DAYS) return false;
            }
            return true;
          })
          .map(p => {
            const b = boosts.find(b => b.id === p.contentId);
            if (!b || !b.review || !Array.isArray(b.review.questions) || b.review.questions.length === 0) return null;
            return { boost: b, progress: p, daysSinceCompletion: Math.floor((now - Date.parse(p.completedAt)) / (24 * 60 * 60 * 1000)) };
          })
          .filter(Boolean)
          .sort((a, b) => Date.parse(a.progress.completedAt) - Date.parse(b.progress.completedAt));
        if (!cancelled) setReviewableBoost(reviewable[0] ?? null);

      } catch (e) {
        console.error("Home load failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleOnboardingDone = async (selections) => {
    if (user) {
      try {
        await base44.entities.UserStats.create({
          userId: user.id,
          totalXp: 0,
          totalLessonsCompleted: 0,
          totalBoostsCompleted: 0,
          totalJourneysCompleted: 0,
          favoriteTracks: selections.tracks ?? [],
          lastActivityAt: new Date().toISOString(),
        });
      } catch (_) {}
    }
    trackEvent("onboarding_completed", {
      selected_goal: selections.tracks?.[0] ?? "all",
      selected_use_case: selections.tracks?.join(",") || "all",
      time_to_complete_seconds: selections.timeToCompleteSeconds ?? null,
    });
    setShowOnboarding(false);
    if (selections.firstBoostSlug) {
      navigate(`/boost/${selections.firstBoostSlug}?source=onboarding`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5)  return "Late night";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 22) return "Good evening";
    return "Late tonight";
  })();

  return (
    <>
      {showOnboarding && <OnboardingModal onDone={handleOnboardingDone} />}

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-7 md:space-y-9">

        {/* Greeting */}
        <div className="space-y-1">
          <div className="ui-eyebrow">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</div>
          <h1 className="text-2xl md:text-3xl ui-heading">
            {greeting}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.
          </h1>
        </div>

        {/* Product promise */}
        <section className="rounded-lg border border-border bg-surface-1 p-4 md:p-5">
          <div className="ui-eyebrow mb-1">Stratium Lab</div>
          <h2 className="text-xl md:text-2xl ui-heading">Stop getting generic AI output.</h2>
          <p className="text-sm text-text-secondary leading-relaxed mt-2 max-w-2xl">
            Practice the habits that make AI useful at work: clearer context, better constraints, sharper revision, and more honest judgment.
          </p>
        </section>

        {/* Today's lesson */}
        {nextLesson && (
          <section
            onClick={() => navigate(`/lesson/${nextLesson.id}`)}
            className="group cursor-pointer rounded-xl border border-border-strong bg-surface-1 p-5 md:p-6 hover:border-accent transition-colors duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-surface-2 items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-accent" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="ui-eyebrow mb-1">Continue · {nextLessonJourney?.title}</div>
                <h2 className="text-lg md:text-xl ui-heading">{nextLesson.title}</h2>
                {nextLesson.subtitle && (
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed line-clamp-2">{nextLesson.subtitle}</p>
                )}
                <div className="flex items-center gap-3 mt-4 text-xs text-text-secondary">
                  {nextLesson.estimatedMinutes && (
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{nextLesson.estimatedMinutes} min</span>
                  )}
                  <span>·</span>
                  <span>+{nextLesson.xpReward} XP</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150 hidden sm:block mt-1" />
            </div>
          </section>
        )}

        {/* Recommended boost */}
        {recommendedBoost && (
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-sm ui-heading text-text-primary">A 3-minute move for today</h3>
              <button onClick={() => navigate("/library")} className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
                All boosts <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div
              onClick={() => navigate(`/boost/${recommendedBoost.id}?source=home_recommended`)}
              className="cursor-pointer rounded-lg border border-border bg-surface-1 p-4 hover:border-border-strong transition-colors"
            >
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary leading-snug">{recommendedBoost.title}</div>
                  {recommendedBoost.subtitle && (
                    <div className="text-xs text-text-secondary mt-1 line-clamp-1">{recommendedBoost.subtitle}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-text-muted">
                    <span>{recommendedBoost.estimatedMinutes ?? 4} min</span>
                    <span>·</span>
                    <span>{recommendedBoost.category}</span>
                    <span>·</span>
                    <span>+{recommendedBoost.xpReward ?? 40} XP</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Worth refreshing (review nudge) */}
        {reviewableBoost && (
          <section>
            <h3 className="text-sm ui-heading text-text-primary mb-3">Worth refreshing</h3>
            <div
              onClick={() => navigate(`/review/${reviewableBoost.boost.id}?source=home_refresh`)}
              className="cursor-pointer rounded-lg border border-border bg-surface-1 p-4 hover:border-border-strong transition-colors"
            >
              <div className="flex items-start gap-3">
                <Repeat className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary leading-snug">{reviewableBoost.boost.title}</div>
                  <div className="text-xs text-text-secondary mt-1">
                    You learned this {reviewableBoost.daysSinceCompletion} day{reviewableBoost.daysSinceCompletion === 1 ? "" : "s"} ago. 90-second review.
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* In-progress journeys */}
        {activeJourneys.length > 0 && (
          <section>
            <h3 className="text-sm ui-heading text-text-primary mb-3">In progress</h3>
            <div className="space-y-2">
              {activeJourneys.map(j => {
                const pct = j.total > 0 ? Math.round((j.completed / j.total) * 100) : 0;
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
                      <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Today's signal */}
        {todaySignal && (
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-sm ui-heading text-text-primary flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-accent" /> Today's signal
              </h3>
              <button onClick={() => navigate("/signals")} className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1">
                Archive <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <article
              onClick={() => navigate(`/signals/${todaySignal.slug ?? todaySignal.id}`)}
              className="cursor-pointer rounded-lg border border-border bg-surface-1 p-4 hover:border-border-strong transition-colors"
            >
              <div className="text-[11px] text-text-muted mb-1.5">{todaySignal.sourceName} · {todaySignal.date}</div>
              <h4 className="text-base font-medium text-text-primary leading-snug">{todaySignal.title}</h4>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed line-clamp-2">{todaySignal.teaser}</p>
            </article>
          </section>
        )}

      </div>
    </>
  );
}
