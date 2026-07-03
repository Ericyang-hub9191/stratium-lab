import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Home as HomeIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { inlineMd } from "@/components/blocks";
import { getNavigationSource, trackEvent } from "@/lib/analytics";
import { applyBoostContentOverrides } from "@/lib/content-overrides";
import { getBoostBySlugOrId } from "@/lib/content-adapter";

async function findBoost(idOrSlug) {
  const local = getBoostBySlugOrId(idOrSlug);
  if (local) return local;

  const idResults = await base44.entities.Boost.filter({ id: idOrSlug });
  if (idResults[0]) return applyBoostContentOverrides(idResults[0]);

  const slugResults = await base44.entities.Boost.filter({ slug: idOrSlug, isPublished: true });
  return applyBoostContentOverrides(slugResults[0] ?? null);
}

export default function ReviewScreen() {
  const { boostId } = useParams();
  const navigate = useNavigate();

  const [boost, setBoost] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [boostRecord, user] = await Promise.all([
          findBoost(boostId),
          base44.auth.me(),
        ]);
        if (cancelled) return;
        const b = boostRecord;
        if (!b) { setError("Boost not found."); setLoading(false); return; }
        if (!b.review || !Array.isArray(b.review.questions) || b.review.questions.length === 0) {
          setError("No review available for this boost."); setLoading(false); return;
        }
        const progressRows = await base44.entities.UserProgress.filter({
          userId: user.id, contentId: b.id, contentType: "boost",
        });
        if (cancelled) return;
        const p = progressRows?.[0] ?? null;
        if (!p || p.status !== "completed") {
          setError("You can only review boosts you've completed."); setLoading(false); return;
        }
        setBoost(b);
        setProgress(p);
        trackEvent("review_started", {
          boost_id: b.id,
          days_since_completion: p.completedAt ? Math.floor((Date.now() - Date.parse(p.completedAt)) / (24 * 60 * 60 * 1000)) : null,
          source: getNavigationSource(),
        });
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError("Couldn't load this review. Try again in a moment.");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [boostId]);

  const questions = boost?.review?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i]?.value !== undefined && !answers[i]?.checking);

  const onAnswerMCQ = (idx, q, choiceId) => {
    if (answers[idx]?.value !== undefined) return;
    const isCorrect = choiceId === q.correct;
    setAnswers(prev => ({ ...prev, [idx]: { type: "mcq", value: choiceId, isCorrect, feedback: q.explanation } }));
  };

  const onSubmitFillIn = async (idx, q, userText) => {
    if (answers[idx]?.value !== undefined) return;
    const trimmed = userText.trim();
    if (trimmed.length < 1) return;
    setAnswers(prev => ({ ...prev, [idx]: { type: "fill-in", value: trimmed, checking: true } }));
    try {
      const response = await base44.functions.invoke("gradePractice", {
        lessonContext: `Question: ${q.prompt}\nAccepted answers: ${JSON.stringify(q.acceptedAnswers ?? [])}`,
        taskPrompt: q.prompt,
        userResponse: trimmed,
        rubricType: "match",
        attemptNumber: 1,
      });
      const resp = response?.data ?? response;
      const isCorrect = resp.verdict === "strong";
      setAnswers(prev => ({
        ...prev,
        [idx]: { type: "fill-in", value: trimmed, isCorrect, isPartial: resp.verdict === "workable", feedback: resp.feedback || q.explanation },
      }));
    } catch (e) {
      console.error("review grading failed:", e);
      const accepted = (q.acceptedAnswers ?? []).map(a => a.toLowerCase().trim());
      const u = trimmed.toLowerCase();
      const isCorrect = accepted.some(a => u.includes(a) || a.includes(u));
      setAnswers(prev => ({
        ...prev,
        [idx]: {
          type: "fill-in", value: trimmed, isCorrect,
          feedback: isCorrect ? "Got it. " + (q.explanation ?? "") : "Not quite — accepted phrasings include: " + (q.acceptedAnswers ?? []).slice(0, 3).join("; "),
        },
      }));
    }
  };

  const completeReview = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await base44.entities.UserProgress.update(progress.id, {
        lastReviewedAt: new Date().toISOString(),
        reviewCount: (progress.reviewCount ?? 0) + 1,
      });
      trackEvent("review_completed", {
        boost_id: boost.id,
        score: Object.values(answers).filter(a => a.isCorrect).length,
        question_count: questions.length,
        match_questions_count: questions.filter(q => q.type === "fill-in").length,
        time_to_complete_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      });
    } catch (e) {
      console.error("review save failed:", e);
    } finally {
      setSaving(false);
      setCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sm text-text-muted">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-base text-text-primary">{error}</div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost">Go back</button>
        </div>
      </div>
    );
  }

  if (completed) {
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16 animate-fade-in">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "hsla(152, 45%, 55%, 0.12)" }}>
              <Check className="w-5 h-5" style={{ color: "hsl(152, 45%, 45%)" }} />
            </div>
            <div>
              <div className="ui-eyebrow mb-1">Reviewed</div>
              <h1 className="text-2xl ui-heading">{boost.title}</h1>
              <div className="text-sm text-text-muted mt-2">{correctCount} of {questions.length} correct on first try</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5">Takeaway</div>
            <div className="text-sm text-text-primary leading-relaxed">{boost.review.takeaway}</div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-lg border border-border bg-surface-1 hover:border-border-strong transition-colors p-4 text-left flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center shrink-0">
              <HomeIcon className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">Back to home</div>
              <div className="text-[11px] text-text-muted mt-0.5">See you tomorrow</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "hsl(var(--reading-bg))" }}>
      <div className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn btn-ghost !py-1.5 !px-2.5" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="ui-eyebrow">Review · {questions.length} questions</div>
            <div className="text-sm font-medium text-text-primary truncate">{boost.title}</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="rounded-xl p-5" style={{ background: "hsla(var(--accent), 0.10)", border: "1px solid hsla(var(--accent), 0.35)" }}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-accent mb-2">You learned this</div>
          <div className="text-base leading-relaxed" style={{ color: "hsl(var(--reading-text))" }}>{boost.review.takeaway}</div>
        </div>

        {questions.map((q, idx) => (
          <ReviewQuestion
            key={idx}
            index={idx}
            question={q}
            answer={answers[idx]}
            onAnswerMCQ={(choiceId) => onAnswerMCQ(idx, q, choiceId)}
            onSubmitFillIn={(text) => onSubmitFillIn(idx, q, text)}
          />
        ))}

        {allAnswered && (
          <button onClick={completeReview} disabled={saving} className="btn btn-primary w-full !py-3">
            {saving ? "Saving…" : "Done"}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewQuestion({ index, question, answer, onAnswerMCQ, onSubmitFillIn }) {
  const isAnswered = answer?.value !== undefined && !answer?.checking;
  const isChecking = answer?.checking;

  if (question.type === "mcq") {
    return (
      <div className="reading-card rounded-xl p-5 space-y-3">
        <div className="ui-eyebrow">Q{index + 1}</div>
        <div className="text-[1.0625em] font-medium leading-snug" style={{ color: "hsl(var(--reading-text))" }}>
          {inlineMd(question.question)}
        </div>
        <div className="space-y-2 pt-1">
          {question.choices.map(c => {
            const isSelected = answer?.value === c.id;
            const isCorrectChoice = c.id === question.correct;
            const showAsRight = isAnswered && isCorrectChoice;
            const showAsWrong = isAnswered && isSelected && !isCorrectChoice;
            return (
              <button
                key={c.id}
                onClick={() => onAnswerMCQ(c.id)}
                disabled={isAnswered}
                className="w-full text-left rounded-lg p-3 transition-colors"
                style={{
                  background: showAsRight ? "hsla(152, 45%, 55%, 0.12)" : showAsWrong ? "hsla(0, 60%, 55%, 0.10)" : isSelected ? "hsla(var(--accent), 0.12)" : "hsl(var(--reading-surface))",
                  border: showAsRight ? "1px solid hsla(152, 45%, 45%, 0.5)" : showAsWrong ? "1px solid hsla(0, 60%, 55%, 0.4)" : "1px solid hsl(var(--reading-border))",
                  cursor: isAnswered ? "default" : "pointer",
                }}
              >
                <span className="text-[0.95em]" style={{ color: "hsl(var(--reading-text))" }}>{inlineMd(c.text)}</span>
              </button>
            );
          })}
        </div>
        {isAnswered && (
          <div className="rounded-lg p-3 text-[0.92em] leading-relaxed" style={{
            background: answer.isCorrect ? "hsla(152, 45%, 55%, 0.06)" : "hsla(0, 60%, 55%, 0.05)",
            border: `1px solid ${answer.isCorrect ? "hsla(152, 45%, 45%, 0.3)" : "hsla(0, 60%, 55%, 0.25)"}`,
            color: "hsl(var(--reading-text))",
          }}>
            {inlineMd(answer.feedback)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="reading-card rounded-xl p-5 space-y-3">
      <div className="ui-eyebrow">Q{index + 1} · fill-in</div>
      <div className="text-[1.0625em] font-medium leading-snug" style={{ color: "hsl(var(--reading-text))" }}>
        {inlineMd(question.prompt)}
      </div>
      <FillInInput question={question} answer={answer} isAnswered={isAnswered} isChecking={isChecking} onSubmit={onSubmitFillIn} />
      {isAnswered && (
        <div className="rounded-lg p-3 text-[0.92em] leading-relaxed" style={{
          background: answer.isCorrect ? "hsla(152, 45%, 55%, 0.06)" : answer.isPartial ? "hsla(40, 70%, 55%, 0.06)" : "hsla(0, 60%, 55%, 0.05)",
          border: `1px solid ${answer.isCorrect ? "hsla(152, 45%, 45%, 0.3)" : answer.isPartial ? "hsla(40, 70%, 50%, 0.3)" : "hsla(0, 60%, 55%, 0.25)"}`,
          color: "hsl(var(--reading-text))",
        }}>
          {inlineMd(answer.feedback)}
        </div>
      )}
    </div>
  );
}

function FillInInput({ question, answer, isAnswered, isChecking, onSubmit }) {
  const [text, setText] = useState(answer?.value ?? "");

  if (isAnswered) {
    return (
      <div className="rounded-lg p-3 text-[0.95em]" style={{
        background: "hsl(var(--reading-code-bg))",
        border: "1px solid hsl(var(--reading-border))",
        color: "hsl(var(--reading-text))",
      }}>
        {answer.value}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && text.trim().length > 0) onSubmit(text); }}
        placeholder={question.answerHint ? `Your answer (${question.answerHint})…` : "Your answer…"}
        disabled={isChecking}
        className="w-full rounded-lg px-3 py-2 text-[0.95em] focus:outline-none focus:ring-2"
        style={{
          background: "hsl(var(--reading-code-bg))",
          border: "1px solid hsl(var(--reading-border))",
          color: "hsl(var(--reading-text))",
        }}
      />
      <div className="flex justify-end">
        <button onClick={() => onSubmit(text)} disabled={isChecking || text.trim().length === 0} className="btn btn-primary !text-[0.85em] !py-2 !px-4">
          {isChecking ? "Checking…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
