/* ─────────────────────────────────────────────────────────────
   Block renderers.
   ───────────────────────────────────────────────────────────── */

import { useState, useRef } from "react";
import { Check, X, Copy, ExternalLink, Info, Lightbulb, AlertTriangle, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { markFirstSessionStep, trackEvent } from "@/lib/analytics";

export function inlineMd(text = "") {
  const parts = [];
  let remaining = text;
  let key = 0;
  const push = (node) => parts.push(<span key={key++}>{node}</span>);
  const rx = /(\*\*[^*]+\*\*|==[^=]+==|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIdx = 0;
  let match;
  while ((match = rx.exec(remaining)) !== null) {
    if (match.index > lastIdx) push(remaining.slice(lastIdx, match.index));
    const token = match[0];
    if (token.startsWith("**")) push(<strong>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("==")) push(<mark>{token.slice(2, -2)}</mark>);
    else if (token.startsWith("_")) push(<em>{token.slice(1, -1)}</em>);
    else if (token.startsWith("`")) push(<code>{token.slice(1, -1)}</code>);
    else if (token.startsWith("[")) {
      const m = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (m) push(<a href={m[2]} target="_blank" rel="noreferrer">{m[1]}</a>);
    }
    lastIdx = match.index + token.length;
  }
  if (lastIdx < remaining.length) push(remaining.slice(lastIdx));
  return parts;
}

function TextBlock({ block }) {
  const paragraphs = (block.markdown ?? "").split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        if (p.split("\n").every(line => /^\s*-\s+/.test(line))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5">
              {p.split("\n").map((line, j) => <li key={j}>{inlineMd(line.replace(/^\s*-\s+/, ""))}</li>)}
            </ul>
          );
        }
        if (p.split("\n").every(line => /^\s*\d+\.\s+/.test(line))) {
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1.5">
              {p.split("\n").map((line, j) => <li key={j}>{inlineMd(line.replace(/^\s*\d+\.\s+/, ""))}</li>)}
            </ol>
          );
        }
        return <p key={i}>{inlineMd(p)}</p>;
      })}
    </div>
  );
}

function HeadingBlock({ block }) {
  const level = block.level ?? 2;
  const Tag = level === 1 ? "h1" : level === 3 ? "h3" : "h2";
  return <Tag>{block.text}</Tag>;
}

function CodeBlock({ block }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(block.code ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch (_) {}
  };
  return (
    <div className="relative group">
      {block.title && <div className="eyebrow mb-1.5">{block.title}</div>}
      <pre><code>{block.code}</code></pre>
      <button onClick={copy} className="absolute top-2 right-2 btn btn-ghost !py-1 !px-2 !text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--reading-secondary))" }} aria-label="Copy code">
        {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
      </button>
    </div>
  );
}

function ExampleBlock({ block }) {
  return (
    <figure className="reading-card rounded-xl p-5 my-2">
      {block.label && <figcaption className="eyebrow mb-2">{block.label}</figcaption>}
      <div className="leading-relaxed">{inlineMd(block.content ?? "")}</div>
    </figure>
  );
}

const CALLOUT_STYLES = {
  info:    { Icon: Info,          color: "hsl(235, 60%, 50%)", bg: "hsla(235, 70%, 50%, 0.06)", border: "hsla(235, 60%, 50%, 0.25)" },
  tip:     { Icon: Lightbulb,     color: "hsl(40,  70%, 38%)", bg: "hsla(40,  80%, 55%, 0.08)", border: "hsla(40, 60%, 45%, 0.28)" },
  warning: { Icon: AlertTriangle, color: "hsl(25,  80%, 40%)", bg: "hsla(25,  80%, 55%, 0.08)", border: "hsla(25, 70%, 45%, 0.28)" },
  caution: { Icon: ShieldAlert,   color: "hsl(0,   65%, 42%)", bg: "hsla(0,   70%, 55%, 0.06)", border: "hsla(0,  60%, 50%, 0.28)" },
};

function CalloutBlock({ block }) {
  const style = CALLOUT_STYLES[block.variant] ?? CALLOUT_STYLES.info;
  const { Icon } = style;
  return (
    <aside className="flex gap-3 rounded-lg border px-4 py-3.5 my-1" style={{ background: style.bg, borderColor: style.border }}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: style.color }} />
      <div className="flex-1 text-[0.95em]">
        {block.title && <div className="font-medium mb-0.5" style={{ color: style.color }}>{block.title}</div>}
        <div>{inlineMd(block.body ?? "")}</div>
      </div>
    </aside>
  );
}

function PromptBlock({ block, progress }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(block.prompt ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      if (progress?.contentType === "boost") {
        const payload = {
          boost_id: progress.contentId,
          block_id: block.id,
          prompt_variant: block.label ?? block.id ?? "prompt",
          step_name: block.title ?? block.label ?? "prompt",
        };
        trackEvent("prompt_copied", payload);
        markFirstSessionStep("prompt_copied", { boost_id: progress.contentId });
      }
    } catch (_) {}
  };
  return (
    <div className="reading-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "hsl(var(--reading-border))" }}>
        <div className="eyebrow">Prompt</div>
        <button onClick={copy} className="text-xs font-medium flex items-center gap-1.5 hover:opacity-70 transition-opacity" style={{ color: "hsl(var(--reading-accent))" }}>
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="!border-0 !rounded-none !m-0" style={{ background: "transparent" }}><code>{block.prompt}</code></pre>
      {block.annotation && (
        <div className="px-4 py-2.5 border-t text-[0.88em] muted" style={{ borderColor: "hsl(var(--reading-border))" }}>
          {inlineMd(block.annotation)}
        </div>
      )}
    </div>
  );
}

function CompareBlock({ block }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="reading-card rounded-xl p-4" style={{ borderColor: "hsla(0, 50%, 55%, 0.35)" }}>
        <div className="eyebrow flex items-center gap-1.5" style={{ color: "hsl(0, 50%, 45%)" }}>
          <X className="w-3 h-3" /> {block.left?.label ?? "Before"}
        </div>
        <div className="mt-2 text-[0.95em] leading-relaxed">{inlineMd(block.left?.content ?? "")}</div>
      </div>
      <div className="reading-card rounded-xl p-4" style={{ borderColor: "hsla(152, 45%, 45%, 0.4)" }}>
        <div className="eyebrow flex items-center gap-1.5" style={{ color: "hsl(152, 45%, 35%)" }}>
          <Check className="w-3 h-3" /> {block.right?.label ?? "After"}
        </div>
        <div className="mt-2 text-[0.95em] leading-relaxed">{inlineMd(block.right?.content ?? "")}</div>
      </div>
    </div>
  );
}

function CheckBlock({ block, progress, onProgress }) {
  const saved = progress?.checkAnswers?.[block.id];
  const inReviewMode = Boolean(saved?.correct);
  const [chosen,     setChosen]    = useState(saved?.chosenId ?? null);
  const [submitted,  setSubmitted] = useState(Boolean(saved));
  const [showWhyNot, setShowWhyNot] = useState(false);
  const priorAttempts    = saved?.attempts ?? 0;
  const firstWrongChoice = saved?.firstWrongChoice ?? null;

  const submit = () => {
    if (!chosen) return;
    const correct  = chosen === block.correct;
    const attempts = priorAttempts + 1;
    setSubmitted(true);
    const nextFirstWrong = firstWrongChoice || (!correct ? chosen : null);
    onProgress?.({
      checkAnswers: {
        ...(progress?.checkAnswers ?? {}),
        [block.id]: { chosenId: chosen, correct, attempts, ...(nextFirstWrong ? { firstWrongChoice: nextFirstWrong } : {}) },
      },
    });
  };

  const retry = () => { setSubmitted(false); setShowWhyNot(false); setChosen(null); };
  const isCorrect = submitted && chosen === block.correct;
  const isWrong   = submitted && chosen !== block.correct;
  const chosenExplanation = block.choiceExplanations?.[chosen] || block.explanation || "";
  const otherChoices = (block.choices ?? []).filter(c => c.id !== chosen);
  const hasPerChoiceFeedback = Boolean(block.choiceExplanations);

  return (
    <div className="reading-card rounded-xl p-5 space-y-4 my-2">
      <div className="flex items-center gap-2 eyebrow">
        <span>Checkpoint</span>
        {block.required === false && <span className="opacity-60">— optional</span>}
        {submitted && isCorrect && priorAttempts > 1 && (
          <span className="ml-auto text-[11px]" style={{ color: "hsl(40, 70%, 38%)" }}>Got it after {priorAttempts} {priorAttempts === 2 ? "try" : "tries"}</span>
        )}
        {submitted && isCorrect && priorAttempts === 1 && (
          <span className="ml-auto text-[11px]" style={{ color: "hsl(152, 45%, 35%)" }}>First try ✓</span>
        )}
      </div>

      <div className="text-[1.0625em] font-medium" style={{ color: "hsl(var(--reading-text))" }}>{inlineMd(block.question)}</div>

      <div className="space-y-2">
        {(block.choices ?? []).map(choice => {
          const isChosen         = chosen === choice.id;
          const isCorrectAnswer  = submitted && choice.id === block.correct;
          const isWrongChoice    = submitted && isChosen && choice.id !== block.correct;
          const isFirstWrongTrace = inReviewMode && firstWrongChoice === choice.id && choice.id !== block.correct;
          let borderColor = "hsl(var(--reading-border))";
          let bg = "transparent";
          if (submitted) {
            if (isCorrectAnswer) { borderColor = "hsla(152, 45%, 45%, 0.6)"; bg = "hsla(152, 45%, 55%, 0.08)"; }
            else if (isWrongChoice || isFirstWrongTrace) { borderColor = "hsla(0, 60%, 55%, 0.35)"; bg = "hsla(0, 60%, 55%, 0.04)"; }
          } else if (isChosen) { borderColor = "hsl(var(--reading-accent))"; bg = "hsla(250, 70%, 58%, 0.05)"; }

          return (
            <button key={choice.id} onClick={() => !submitted && setChosen(choice.id)} disabled={submitted}
              className="w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-colors duration-150"
              style={{ borderColor, background: bg, cursor: submitted ? "default" : "pointer" }}>
              <span className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 text-[11px] font-semibold"
                style={{ borderColor: isChosen || isCorrectAnswer ? borderColor : "hsl(var(--reading-border))", background: isChosen && !submitted ? "hsl(var(--reading-accent))" : "transparent", color: isChosen && !submitted ? "white" : "hsl(var(--reading-secondary))" }}>
                {isCorrectAnswer ? <Check className="w-3 h-3" style={{ color: "hsl(152, 45%, 35%)" }} />
                 : (isWrongChoice || isFirstWrongTrace) ? <X className="w-3 h-3" style={{ color: "hsl(0, 60%, 50%)" }} />
                 : choice.id.toUpperCase()}
              </span>
              <span className="flex-1 text-[0.95em] leading-snug" style={{ color: "hsl(var(--reading-text))" }}>{inlineMd(choice.text)}</span>
              {isFirstWrongTrace && (
                <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold self-center" style={{ color: "hsl(0, 50%, 50%)", opacity: 0.7 }}>your first guess</span>
              )}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button onClick={submit} disabled={!chosen} className="btn btn-primary w-full md:w-auto">Check answer</button>
      ) : (
        <>
          <div className="rounded-lg p-4 text-[0.95em] leading-relaxed"
            style={{ background: isCorrect ? "hsla(152, 45%, 55%, 0.08)" : "hsla(0, 60%, 55%, 0.06)", border: `1px solid ${isCorrect ? "hsla(152, 45%, 45%, 0.35)" : "hsla(0, 60%, 55%, 0.3)"}` }}>
            <div className="font-medium mb-1" style={{ color: isCorrect ? "hsl(152, 45%, 32%)" : "hsl(0, 60%, 42%)" }}>{isCorrect ? "Correct." : "Not quite."}</div>
            <div>{inlineMd(chosenExplanation)}</div>
            {isWrong && <button onClick={retry} className="mt-3 text-[0.88em] font-medium underline underline-offset-2" style={{ color: "hsl(var(--reading-accent))" }}>Try again</button>}
          </div>
          {hasPerChoiceFeedback && otherChoices.length > 0 && (
            <div className="pt-1">
              <button onClick={() => setShowWhyNot(v => !v)} className="text-[0.88em] font-medium flex items-center gap-1.5" style={{ color: "hsl(var(--reading-secondary))" }}>
                <span>{showWhyNot ? "Hide" : "Why weren't the others right?"}</span>
                <span style={{ transform: showWhyNot ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>↓</span>
              </button>
              {showWhyNot && (
                <div className="mt-3 space-y-3">
                  {otherChoices.map(c => {
                    const note = block.choiceExplanations?.[c.id];
                    if (!note) return null;
                    return (
                      <div key={c.id} className="rounded-lg p-3.5 text-[0.9em] leading-relaxed" style={{ background: "hsl(var(--reading-code-bg))", border: "1px solid hsl(var(--reading-border))" }}>
                        <div className="font-medium mb-1" style={{ color: "hsl(var(--reading-text))" }}>{c.id.toUpperCase()} · {inlineMd(c.text)}</div>
                        <div className="muted">{inlineMd(note)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PracticeBlock({ block, progress, onProgress }) {
  const savedEntry = progress?.practiceEntries?.[block.id];
  const initialText = typeof savedEntry === "string" ? savedEntry : (savedEntry?.text ?? "");
  const initialSubmissions = (savedEntry && typeof savedEntry === "object" && Array.isArray(savedEntry.submissions)) ? savedEntry.submissions : [];

  const [value, setValue]           = useState(initialText);
  const [submissions, setSubs]      = useState(initialSubmissions);
  const [grading, setGrading]       = useState(false);
  const [gradingError, setErr]      = useState(null);
  const [showShortConfirm, setShow] = useState(false);
  const blockRef                    = useRef(null);

  const maxAttempts    = block.maxAttempts ?? 2;
  const softGateChars  = block.softGateChars ?? 40;
  const explicitRubricType = block.rubricType ?? null;
  const attemptsUsed   = submissions.length;
  const attemptsLeft   = Math.max(0, maxAttempts - attemptsUsed);
  const canSubmit      = attemptsLeft > 0 && !grading && value.trim().length > 0;
  const lastSubmission = submissions[submissions.length - 1] ?? null;

  const saveDraft = (v) => {
    setValue(v);
    onProgress?.({
      practiceEntries: { ...(progress?.practiceEntries ?? {}), [block.id]: { text: v, submissions } },
    });
  };

  const doSubmit = async () => {
    if (!canSubmit) return;
    if (value.trim().length < softGateChars && !showShortConfirm) { setShow(true); return; }
    setShow(false);
    setGrading(true);
    setErr(null);
    const requestedAt = Date.now();
    const rubricType = explicitRubricType ?? "reflection";
    const isBoostPractice = progress?.contentType === "boost";
    const isFirstReflection = isBoostPractice && Object.values(progress?.practiceEntries ?? {}).every(entry => {
      if (!entry) return true;
      if (typeof entry === "string") return entry.trim().length === 0;
      return !Array.isArray(entry.submissions) || entry.submissions.length === 0;
    });
    if (isBoostPractice) {
      const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
      trackEvent("reflection_submitted", {
        boost_id: progress.contentId,
        block_id: block.id,
        rubric_type: rubricType,
        word_count: wordCount,
        is_first_reflection: isFirstReflection,
      });
      markFirstSessionStep("prompt_used", { boost_id: progress.contentId });
      markFirstSessionStep("reflection_submitted", { boost_id: progress.contentId });
    }
    try {
      const response = await base44.functions.invoke("gradePractice", {
        lessonContext: block.lessonContext ?? "",
        taskPrompt:    block.instruction ?? "",
        userResponse:  value.trim(),
        ...(explicitRubricType ? { rubricType: explicitRubricType } : {}),
        attemptNumber: attemptsUsed + 1,
      });

      const resp = response?.data ?? response;

      if (resp?.error) {
        setErr(resp.message ?? "Couldn't grade this submission. Try again.");
        setGrading(false);
        return;
      }

      const submission = {
        text:        value.trim(),
        submittedAt: new Date().toISOString(),
        verdict:     resp.verdict,
        dimensions:  resp.dimensions ?? [],
        feedback:    resp.feedback,
        oneChange:   resp.oneChange ?? null,
        rubricType:  resp.rubricType ?? explicitRubricType ?? "reflection",
      };
      const newSubs = [...submissions, submission];
      setSubs(newSubs);
      onProgress?.({
        practiceEntries: { ...(progress?.practiceEntries ?? {}), [block.id]: { text: value, submissions: newSubs } },
      });
      if (isBoostPractice) {
        trackEvent("practice_feedback_viewed", {
          boost_id: progress.contentId,
          block_id: block.id,
          rubric_type: submission.rubricType,
          verdict: submission.verdict,
          latency_ms: Date.now() - requestedAt,
          fallback_used: false,
        });
        markFirstSessionStep("practice_feedback_viewed", { boost_id: progress.contentId });
      }
      if (blockRef.current) blockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {
      console.error("grading failed:", e);
      setErr("Feedback is unavailable right now. Try again in a moment.");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div ref={blockRef} className="reading-card rounded-xl p-5 space-y-3 my-2 transition-opacity" style={{ opacity: grading ? 0.75 : 1 }}>
      <div className="flex items-center gap-2 eyebrow">
        <span>Practice</span>
        {attemptsUsed > 0 && <span className="opacity-60">— attempt {attemptsUsed}{attemptsLeft > 0 ? ` of ${maxAttempts}` : ""}</span>}
      </div>

      <div className="text-[1.0625em] font-medium" style={{ color: "hsl(var(--reading-text))" }}>{inlineMd(block.instruction ?? "")}</div>
      {block.deliverable && <div className="text-[0.9em] muted italic">Write: {block.deliverable}</div>}

      <textarea value={value} onChange={(e) => saveDraft(e.target.value)}
        placeholder={block.placeholder ?? "Write your answer here…"} rows={5}
        disabled={grading || attemptsLeft === 0} className="w-full rounded-lg px-3.5 py-3 text-[0.95em] resize-y font-reading"
        style={{ background: "hsl(var(--reading-surface))", border: "1px solid hsl(var(--reading-border))", color: "hsl(var(--reading-text))", fontFamily: "var(--font-reading)", lineHeight: 1.55 }} />

      {attemptsLeft > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[0.8em] muted">
            {value.trim().length > 0 && value.trim().length < softGateChars ? `${value.trim().length} chars — on the short side, but you can submit anyway` : ""}
          </div>
          <div className="flex items-center gap-2">
            {showShortConfirm && <span className="text-[0.85em] muted">This looks short — submit anyway?</span>}
            <button onClick={doSubmit} disabled={!canSubmit} className="btn btn-primary !text-[0.85em] !py-2 !px-4">
              {grading ? "Reading your response…"
                : showShortConfirm ? "Submit anyway"
                : attemptsUsed === 0 ? "Submit" : "Submit revised response"}
            </button>
          </div>
        </div>
      )}

      {gradingError && (
        <div className="rounded-lg p-3.5 text-[0.9em]" style={{ background: "hsla(0, 60%, 55%, 0.06)", border: "1px solid hsla(0, 60%, 55%, 0.3)", color: "hsl(0, 60%, 42%)" }}>{gradingError}</div>
      )}

      {grading && (
        <div className="rounded-lg p-4 space-y-2 animate-pulse" style={{ background: "hsl(var(--reading-code-bg))", border: "1px solid hsl(var(--reading-border))" }}>
          <div className="h-3 rounded w-1/3" style={{ background: "hsl(var(--reading-border))" }} />
          <div className="h-2 rounded w-full" style={{ background: "hsl(var(--reading-border))" }} />
          <div className="h-2 rounded w-5/6" style={{ background: "hsl(var(--reading-border))" }} />
          <div className="h-2 rounded w-3/4" style={{ background: "hsl(var(--reading-border))" }} />
        </div>
      )}

      {!grading && lastSubmission && <FeedbackPanel submission={lastSubmission} rubricType={lastSubmission.rubricType} />}

      {!grading && lastSubmission && attemptsLeft > 0 && (
        <div className="text-[0.85em] muted pt-1">
          {lastSubmission.rubricType === "reflection"
            ? `Edit your reflection above and submit again if you want to add more. ${attemptsLeft} update${attemptsLeft === 1 ? "" : "s"} left.`
            : `Edit your response above and submit a revised attempt. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`}
        </div>
      )}

      {!grading && attemptsLeft === 0 && (
        <div className="text-[0.85em] muted pt-1">Your attempts for this practice block are used up. Move on when you're ready.</div>
      )}
    </div>
  );
}

function FeedbackPanel({ submission, rubricType }) {
  // Reflection mode: conversational response, no grading UI
  if (rubricType === "reflection") {
    return (
      <div className="rounded-lg p-4 space-y-2 text-[0.9em] leading-relaxed"
        style={{ background: "hsla(245, 30%, 55%, 0.05)", border: "1px solid hsla(245, 30%, 55%, 0.18)" }}>
        <div className="text-[0.75em] uppercase tracking-wider font-semibold" style={{ color: "hsl(var(--accent))" }}>
          Response
        </div>
        <div style={{ color: "hsl(var(--reading-text))" }}>{submission.feedback}</div>
      </div>
    );
  }

  const verdictColor  = submission.verdict === "strong" ? "hsl(152, 45%, 35%)" : submission.verdict === "workable" ? "hsl(40, 70%, 40%)" : "hsl(0, 60%, 45%)";
  const verdictBg     = submission.verdict === "strong" ? "hsla(152, 45%, 55%, 0.08)" : submission.verdict === "workable" ? "hsla(40, 70%, 55%, 0.08)" : "hsla(0, 60%, 55%, 0.06)";
  const verdictBorder = submission.verdict === "strong" ? "hsla(152, 45%, 45%, 0.35)" : submission.verdict === "workable" ? "hsla(40, 70%, 50%, 0.35)" : "hsla(0, 60%, 55%, 0.3)";
  const verdictLabel  = submission.verdict === "strong" ? "Strong" : submission.verdict === "workable" ? "Workable" : "Needs work";
  const verdictIcon   = submission.verdict === "strong" ? "✓" : submission.verdict === "workable" ? "⚠" : "✗";

  return (
    <div className="rounded-lg p-4 space-y-3 text-[0.9em] leading-relaxed" style={{ background: verdictBg, border: `1px solid ${verdictBorder}` }}>
      <div className="flex items-center gap-2 text-[0.85em] font-semibold uppercase tracking-wider" style={{ color: verdictColor }}>
        <span>{verdictIcon}</span><span>{verdictLabel}</span>
      </div>

      {rubricType === "rctf" && submission.dimensions?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {submission.dimensions.map((d, i) => {
            const c = d.verdict === "✓" ? "hsl(152, 45%, 35%)" : d.verdict === "⚠" ? "hsl(40, 70%, 40%)" : "hsl(0, 60%, 45%)";
            return (
              <div key={i} className="rounded-md p-2.5" style={{ background: "hsla(0, 0%, 50%, 0.04)", border: "1px solid hsla(0, 0%, 50%, 0.08)" }}>
                <div className="flex items-center gap-1.5 text-[0.82em] font-medium">
                  <span style={{ color: c }}>{d.verdict}</span>
                  <span style={{ color: "hsl(var(--reading-text))" }}>{d.name}</span>
                </div>
                {d.note && <div className="text-[0.85em] muted mt-1">{d.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ color: "hsl(var(--reading-text))" }}>{submission.feedback}</div>

      {submission.oneChange && (
        <div className="pt-2 border-t" style={{ borderColor: verdictBorder }}>
          <div className="text-[0.75em] uppercase tracking-wider font-semibold mb-1" style={{ color: verdictColor }}>Try this one change</div>
          <div className="text-[0.92em]" style={{ color: "hsl(var(--reading-text))" }}>{submission.oneChange}</div>
        </div>
      )}
    </div>
  );
}

function WriteBlock({ block, progress, onProgress }) {
  const saved = progress?.writeEntries?.[block.id] ?? "";
  const [value, setValue] = useState(saved);
  const save = (v) => { setValue(v); onProgress?.({ writeEntries: { ...(progress?.writeEntries ?? {}), [block.id]: v } }); };
  return (
    <div className="reading-card rounded-xl p-5 space-y-3 my-2">
      <div className="eyebrow">Reflect</div>
      <div className="text-[1em]" style={{ color: "hsl(var(--reading-text))" }}>{inlineMd(block.content ?? "")}</div>
      <textarea value={value} onChange={(e) => save(e.target.value)} placeholder={block.placeholder ?? "Your thoughts…"} rows={4}
        className="w-full rounded-lg px-3.5 py-3 text-[0.95em] resize-y"
        style={{ background: "hsl(var(--reading-surface))", border: "1px solid hsl(var(--reading-border))", color: "hsl(var(--reading-text))", fontFamily: "var(--font-reading)", lineHeight: 1.55 }} />
      <div className="text-[0.8em] muted">Saved as you type.</div>
    </div>
  );
}

function ReferenceBlock({ block }) {
  return (
    <a href={block.url} target="_blank" rel="noreferrer" className="reading-card rounded-xl p-4 flex items-start gap-3 no-underline hover:border-[hsl(var(--reading-accent))] transition-colors">
      <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--reading-accent))" }} />
      <div className="flex-1">
        <div className="font-medium" style={{ color: "hsl(var(--reading-text))" }}>{block.title ?? block.url}</div>
        {block.note && <div className="text-[0.88em] mt-1 muted">{block.note}</div>}
      </div>
    </a>
  );
}

function DividerBlock() {
  return <hr className="my-2" style={{ border: "none", borderTop: "1px solid hsl(var(--reading-border))" }} />;
}

export default function Block({ block, progress, onProgress }) {
  switch (block.type) {
    case "heading":   return <HeadingBlock block={block} />;
    case "text":      return <TextBlock block={block} />;
    case "code":      return <CodeBlock block={block} />;
    case "example":   return <ExampleBlock block={block} />;
    case "callout":   return <CalloutBlock block={block} />;
    case "prompt":    return <PromptBlock block={block} progress={progress} />;
    case "compare":   return <CompareBlock block={block} />;
    case "check":     return <CheckBlock block={block} progress={progress} onProgress={onProgress} />;
    case "practice":  return <PracticeBlock block={block} progress={progress} onProgress={onProgress} />;
    case "write":     return <WriteBlock block={block} progress={progress} onProgress={onProgress} />;
    case "reference": return <ReferenceBlock block={block} />;
    case "divider":   return <DividerBlock />;
    default:
      console.warn("Unknown block type:", block.type);
      return null;
  }
}

export function allRequiredChecksPassed(blocks, progress) {
  const checks = blocks.filter(b => b.type === "check" && b.required !== false);
  if (checks.length === 0) return true;
  return checks.every(c => progress?.checkAnswers?.[c.id]?.correct === true);
}
