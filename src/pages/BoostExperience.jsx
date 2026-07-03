/* ─────────────────────────────────────────────────────────────
   BoostExperience — standalone 3-5 min practical.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Check, Zap, Repeat } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateStreak, updateUserStatsForBoost } from "@/lib/progress-utils";
import Block, { allRequiredChecksPassed } from "@/components/blocks";
import { getNavigationSource, markFirstSessionStep, trackEvent } from "@/lib/analytics";
import { applyBoostContentOverrides } from "@/lib/content-overrides";
import { getBoostBySlugOrId } from "@/lib/content-adapter";

const FIRST_SESSION_BOOST_SLUG = "let-ai-admit-it-doesnt-know";

function countPracticeSubmissions(progress) {
  return Object.values(progress?.practiceEntries ?? {}).filter(entry => {
    if (!entry) return false;
    if (typeof entry === "string") return entry.trim().length > 0;
    return Array.isArray(entry.submissions) && entry.submissions.length > 0;
  }).length;
}

function requiredPracticeBlocks(blocks) {
  return blocks.filter(b => b.type === "practice" && b.required !== false);
}

function requiredPromptBlocks(blocks) {
  return blocks.filter(b => b.type === "prompt" && b.required !== false);
}

function practiceBlockHasFeedback(progress, blockId) {
  const entry = progress?.practiceEntries?.[blockId];
  return Boolean(entry && typeof entry === "object" && Array.isArray(entry.submissions) && entry.submissions.length > 0);
}

function firstBoostPromptCopyKey(userId, boostId) {
  return `stratiumlab_prompt_copied_${userId}_${boostId}`;
}

function readCopiedPromptIds(userId, boostId) {
  if (typeof window === "undefined" || !userId || !boostId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(firstBoostPromptCopyKey(userId, boostId)) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function findBoost(idOrSlug) {
  const local = getBoostBySlugOrId(idOrSlug);
  if (local) return local;

  const boostResults = await base44.entities.Boost.filter({ id: idOrSlug });
  if (boostResults[0]) return boostResults[0];

  const slugResults = await base44.entities.Boost.filter({ slug: idOrSlug, isPublished: true });
  return slugResults[0] ?? null;
}

export default function BoostExperience() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [boost, setBoost]           = useState(null);
  const [progress, setProgress]     = useState(null);
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState(false);
  const [outcomeAnswered, setOutcomeAnswered] = useState(false);
  const [copiedPromptIds, setCopiedPromptIds] = useState([]);
  const [submittedPracticeIds, setSubmittedPracticeIds] = useState([]);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [boostResults, currentUser] = await Promise.all([
          findBoost(id),
          base44.auth.me().catch(() => null),
        ]);
        if (cancelled) return;
        const rec = applyBoostContentOverrides(boostResults);
        setBoost(rec);
        setUser(currentUser);

        if (currentUser && rec) {
          const [existing, allBoostProgress] = await Promise.all([
            base44.entities.UserProgress.filter({
              userId: currentUser.id,
              contentId: rec.id,
              contentType: "boost",
            }),
            base44.entities.UserProgress.filter({
              userId: currentUser.id,
              contentType: "boost",
            }),
          ]);
          if (existing[0]) {
            if (!cancelled) setProgress(existing[0]);
          } else {
            const created = await base44.entities.UserProgress.create({
              userId: currentUser.id,
              contentId: rec.id,
              contentType: "boost",
              status: "in-progress",
              checkAnswers: {},
              practiceEntries: {},
              writeEntries: {},
              startedAt: new Date().toISOString(),
              xpAwarded: 0,
            });
            if (!cancelled) setProgress(created);
          }
          trackEvent("boost_started", {
            boost_id: rec.id,
            boost_title: rec.title,
            source: getNavigationSource(),
            is_first_boost: allBoostProgress.length === 0,
          });
          markFirstSessionStep("boost_started", { boost_id: rec.id });
        }
      } catch (e) {
        console.error("Failed to load boost:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!user?.id || !boost?.id) return;
    setOutcomeAnswered(localStorage.getItem(`stratiumlab_outcome_${user.id}_${boost.id}`) === "true");
  }, [user?.id, boost?.id]);

  useEffect(() => {
    if (!user?.id || !boost?.id) {
      setCopiedPromptIds([]);
      return;
    }
    setCopiedPromptIds(readCopiedPromptIds(user.id, boost.id));
  }, [user?.id, boost?.id]);

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

  const blocks = boost?.blocks ?? [];
  const requiredChecks = useMemo(() => blocks.filter(b => b.type === "check" && b.required !== false), [blocks]);
  const requiredPrompts = useMemo(() => requiredPromptBlocks(blocks), [blocks]);
  const requiredPractices = useMemo(() => requiredPracticeBlocks(blocks), [blocks]);
  const checksPassed = useMemo(() => allRequiredChecksPassed(blocks, progress), [blocks, progress]);
  const isFirstSessionProofBoost = boost?.slug === FIRST_SESSION_BOOST_SLUG;
  const copiedPrompts = requiredPrompts.length === 0 || requiredPrompts.every(block => copiedPromptIds.includes(block.id));
  const submittedReflection = requiredPractices.length === 0 || requiredPractices.every(block =>
    submittedPracticeIds.includes(block.id) || practiceBlockHasFeedback(progress, block.id)
  );
  const receivedPracticeFeedback = requiredPractices.length === 0 || requiredPractices.every(block =>
    practiceBlockHasFeedback(progress, block.id)
  );

  const handlePromptCopied = (blockId) => {
    if (!isFirstSessionProofBoost || !user?.id || !boost?.id || !blockId) return;
    setCopiedPromptIds(prev => {
      const next = prev.includes(blockId) ? prev : [...prev, blockId];
      localStorage.setItem(firstBoostPromptCopyKey(user.id, boost.id), JSON.stringify(next));
      return next;
    });
  };

  const handlePracticeSubmitted = (blockId) => {
    if (!isFirstSessionProofBoost || !blockId) return;
    setSubmittedPracticeIds(prev => prev.includes(blockId) ? prev : [...prev, blockId]);
  };

  const canComplete = useMemo(() => {
    if (!boost || !progress) return false;
    if (progress.status === "completed") return false;
    if (!checksPassed) return false;
    if (!isFirstSessionProofBoost) return true;
    return copiedPrompts && submittedReflection && receivedPracticeFeedback;
  }, [boost, progress, checksPassed, isFirstSessionProofBoost, copiedPrompts, submittedReflection, receivedPracticeFeedback]);

  const isCompleted = progress?.status === "completed";

  const handleComplete = async () => {
    if (!canComplete || !user || !boost || completing) return;
    setCompleting(true);
    const timeSpent = Math.round((Date.now() - startedAtRef.current) / 1000);
    const totalTimeSpent = (progress.timeSpentSeconds ?? 0) + timeSpent;
    const checkpointCorrectFirstTry = requiredChecks.length === 0
      ? null
      : requiredChecks.every(c => progress?.checkAnswers?.[c.id]?.correct === true && progress?.checkAnswers?.[c.id]?.attempts === 1);
    try {
      await Promise.all([
        base44.entities.UserProgress.update(progress.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
          xpAwarded: boost.xpReward ?? 40,
          timeSpentSeconds: totalTimeSpent,
        }),
        updateStreak(user.id),
        updateUserStatsForBoost(user.id, boost.xpReward ?? 40),
      ]);
      window.dispatchEvent(new CustomEvent("progress-updated"));
      setProgress(p => ({ ...p, status: "completed", completedAt: new Date().toISOString(), xpAwarded: boost.xpReward ?? 40 }));
      trackEvent("boost_completed", {
        boost_id: boost.id,
        time_to_complete_seconds: totalTimeSpent,
        reflection_count: countPracticeSubmissions(progress),
        checkpoint_correct_first_try: checkpointCorrectFirstTry,
      });
    } catch (e) {
      console.error("Complete failed:", e);
    } finally {
      setCompleting(false);
    }
  };

  const answerOutcome = (noticedOutputDifference) => {
    if (!user?.id || !boost?.id) return;
    localStorage.setItem(`stratiumlab_outcome_${user.id}_${boost.id}`, "true");
    setOutcomeAnswered(true);
    if (isFirstSessionProofBoost) {
      trackEvent("first_proof_beta_feedback_submitted", {
        boost_id: boost.id,
        noticed_output_difference: noticedOutputDifference,
      });
    }
    markFirstSessionStep("outcome_answered", {
      boost_id: boost.id,
      noticed_output_difference: noticedOutputDifference,
    });
  };

  const startFirstProofReview = () => {
    if (!boost?.id) return;
    trackEvent("first_proof_review_handoff_clicked", {
      boost_id: boost.id,
      has_review: Boolean(boost.review?.questions?.length),
      source: "boost_completion",
    });
    navigate(`/review/${boost.id}?source=first_proof_handoff`);
  };

  const firstProofSteps = [
    { id: "copy", label: "Copy both prompts into your AI tool", done: copiedPrompts },
    { id: "observe", label: "Compare the AI responses", done: submittedReflection },
    { id: "reflect", label: "Submit what you noticed", done: submittedReflection },
    { id: "feedback", label: "Read your feedback", done: receivedPracticeFeedback },
    { id: "check", label: "Answer the checkpoint", done: checksPassed },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  if (!boost) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-bg">
        <p className="text-text-secondary">Boost not found.</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost !py-1.5 !px-2.5" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-accent flex items-center gap-1">
              <Zap className="w-3 h-3" /> Boost · {boost.category}
            </div>
            <div className="text-sm font-medium text-text-primary truncate">{boost.title}</div>
          </div>
          {boost.estimatedMinutes && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-text-secondary">
              <Clock className="w-3.5 h-3.5" />{boost.estimatedMinutes} min
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 reading-surface py-8 md:py-12 px-4 md:px-8 animate-fade-in">
        <article className="max-w-2xl mx-auto space-y-6 pb-36">
          <header className="space-y-3 pb-4 mb-2 border-b" style={{ borderColor: "hsl(var(--reading-border))" }}>
            <div className="eyebrow">Quick Boost · {boost.category}</div>
            <h1 className="!mt-0">{boost.title}</h1>
            {boost.subtitle && (
              <p className="text-[1.1em] muted !mt-1" style={{ lineHeight: 1.5 }}>{boost.subtitle}</p>
            )}
          </header>

          {blocks.map(block => (
            <Block
              key={block.id}
              block={block}
              progress={progress}
              onProgress={handleProgressUpdate}
              onPromptCopied={handlePromptCopied}
              onPracticeSubmitted={handlePracticeSubmitted}
            />
          ))}
        </article>
      </div>

      <div className="fixed bottom-0 left-0 md:left-60 right-0 z-30 border-t border-border bg-bg/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.28)]">
        {isCompleted && !outcomeAnswered ? (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              {isFirstSessionProofBoost && (
                <div className="text-[11px] font-medium uppercase tracking-wider text-accent mb-1">
                  Quick beta check
                </div>
              )}
              <div className="text-sm md:text-base font-medium text-text-primary leading-snug">
                Did the prompt you tried produce a noticeably better AI response?
              </div>
              <div className="text-xs md:text-sm text-text-secondary mt-1 leading-relaxed">
                {isFirstSessionProofBoost
                  ? "One tap while the result is fresh. Then we'll show the next step."
                  : "Answer based on the result you saw in your own AI tool."}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:shrink-0">
              <button onClick={() => answerOutcome("yes")} className="btn btn-primary min-h-11 !px-4 !text-sm">Yes</button>
              <button onClick={() => answerOutcome("somewhat")} className="btn btn-ghost min-h-11 !px-4 !text-sm">Somewhat</button>
              <button onClick={() => answerOutcome("not_really")} className="btn btn-ghost min-h-11 !px-4 !text-sm">Not yet</button>
              <button onClick={() => answerOutcome("unknown")} className="btn btn-quiet min-h-11 !px-4 !text-sm">Skip</button>
            </div>
          </div>
        ) : isCompleted && isFirstSessionProofBoost ? (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-success text-xs font-medium mb-1">
                <Check className="w-3.5 h-3.5" />
                Proof loop complete · +{progress?.xpAwarded ?? boost.xpReward} XP
              </div>
              <div className="text-sm md:text-base font-medium text-text-primary leading-snug">
                Review is how this turns into a habit.
              </div>
              <div className="text-xs md:text-sm text-text-secondary mt-1 leading-relaxed">
                You tried the prompt, saw the difference, reflected, and got feedback. Take the 90-second review next to lock in the move.
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:shrink-0">
              {boost.review?.questions?.length > 0 && (
                <button onClick={startFirstProofReview} className="btn btn-primary min-h-11 !px-4 !text-sm">
                  <Repeat className="w-4 h-4" /> Start review
                </button>
              )}
              <button onClick={() => navigate("/")} className="btn btn-ghost min-h-11 !px-4 !text-sm">
                Back home
              </button>
            </div>
          </div>
        ) : isFirstSessionProofBoost && !isCompleted ? (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-text-primary mb-2">Finish the proof loop before completing.</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {firstProofSteps.map(step => (
                  <div key={step.id} className={`flex items-center gap-1.5 text-xs leading-snug ${step.done ? "text-success" : "text-text-secondary"}`}>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${step.done ? "border-success bg-success/10" : "border-border"}`}>
                      {step.done && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleComplete} disabled={!canComplete || completing || isCompleted} className="btn btn-primary lg:shrink-0">
              {completing ? "Saving…" : `Complete boost · +${boost.xpReward ?? 40} XP`}
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-3.5 flex items-center gap-4">
            <div className="flex-1 text-xs text-text-secondary">
              {isCompleted
                ? <span className="flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Done · +{progress?.xpAwarded ?? boost.xpReward} XP</span>
                : requiredChecks.length > 0 && !canComplete
                  ? <span>Answer the checkpoint to finish.</span>
                  : canComplete
                    ? <span className="text-text-primary">Ready.</span>
                    : <span>When you've tried it, mark this done.</span>
              }
            </div>
            <button onClick={handleComplete} disabled={!canComplete || completing || isCompleted} className="btn btn-primary">
              {isCompleted ? <><Check className="w-4 h-4" /> Done</>
                : completing ? "Saving…"
                : `Mark done · +${boost.xpReward ?? 40} XP`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
