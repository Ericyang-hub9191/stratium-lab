/* ─────────────────────────────────────────────────────────────
   Block renderers.

   A Lesson/Boost is an ordered array of blocks. <Block /> is a
   dispatch component that picks the right renderer based on
   block.type. All blocks render inside a `.reading-surface`
   (see index.css) which gives them serif typography and the
   warmer reading background.

   Interactive blocks (check, practice, write) accept
   `progress` (the user's saved state for this lesson) and
   `onProgress` (a callback to persist updates). Pure-content
   blocks ignore both.
   ───────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { Check, X, Copy, ExternalLink, Info, Lightbulb, AlertTriangle, ShieldAlert } from "lucide-react";

// ── Tiny markdown: bold/italic/highlight/inline-code/links. Deliberately
//    minimal — if a block needs richer formatting, use multiple blocks.
//    Syntax:
//      **bold**         → <strong>
//      _italic_         → <em>
//      ==highlight==    → <mark> (use sparingly — this is the loudest emphasis)
//      `code`           → <code>
//      [text](url)      → <a>
function inlineMd(text = "") {
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

// ─── TEXT ──────────────────────────────────────────────────
function TextBlock({ block }) {
  // Split on blank lines → paragraphs. Lines starting with "- " become a list.
  const paragraphs = (block.markdown ?? "").split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        if (p.split("\n").every(line => /^\s*-\s+/.test(line))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5">
              {p.split("\n").map((line, j) => (
                <li key={j}>{inlineMd(line.replace(/^\s*-\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (p.split("\n").every(line => /^\s*\d+\.\s+/.test(line))) {
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1.5">
              {p.split("\n").map((line, j) => (
                <li key={j}>{inlineMd(line.replace(/^\s*\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{inlineMd(p)}</p>;
      })}
    </div>
  );
}

// ─── HEADING ────────────────────────────────────────────────
function HeadingBlock({ block }) {
  const level = block.level ?? 2;
  const Tag = level === 1 ? "h1" : level === 3 ? "h3" : "h2";
  return <Tag>{block.text}</Tag>;
}

// ─── CODE ───────────────────────────────────────────────────
function CodeBlock({ block }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(block.code ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch (_) {}
  };
  return (
    <div className="relative group">
      {block.title && <div className="eyebrow mb-1.5">{block.title}</div>}
      <pre><code>{block.code}</code></pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 btn btn-ghost !py-1 !px-2 !text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "hsl(var(--reading-secondary))" }}
        aria-label="Copy code"
      >
        {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
      </button>
    </div>
  );
}

// ─── EXAMPLE (a framed "look at this") ──────────────────────
function ExampleBlock({ block }) {
  return (
    <figure className="reading-card rounded-xl p-5 my-2">
      {block.label && <figcaption className="eyebrow mb-2">{block.label}</figcaption>}
      <div className="leading-relaxed">{inlineMd(block.content ?? "")}</div>
    </figure>
  );
}

// ─── CALLOUT ────────────────────────────────────────────────
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
    <aside
      className="flex gap-3 rounded-lg border px-4 py-3.5 my-1"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: style.color }} />
      <div className="flex-1 text-[0.95em]">
        {block.title && <div className="font-medium mb-0.5" style={{ color: style.color }}>{block.title}</div>}
        <div>{inlineMd(block.body ?? "")}</div>
      </div>
    </aside>
  );
}

// ─── PROMPT (a prompt the user can copy) ────────────────────
function PromptBlock({ block }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(block.prompt ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch (_) {}
  };
  return (
    <div className="reading-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "hsl(var(--reading-border))" }}>
        <div className="eyebrow">Prompt</div>
        <button
          onClick={copy}
          className="text-xs font-medium flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          style={{ color: "hsl(var(--reading-accent))" }}
        >
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

// ─── COMPARE (bad vs good side-by-side) ─────────────────────
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

// ─── CHECK (multiple choice checkpoint — THE learning loop) ─
//
// Data model persisted in UserProgress.checkAnswers[blockId]:
//   {
//     chosenId:          id of the answer currently on screen (latest submission)
//     correct:           whether the current submission is right
//     attempts:          how many times the user submitted
//     firstWrongChoice:  id of the FIRST wrong choice, if the user was ever wrong.
//                        Set once on the first wrong submission and never overwritten,
//                        so reviewing the lesson later shows what the learner was
//                        confused about, not just that they eventually got it right.
//   }
//
// Block definition fields:
//   - question, choices, correct         — standard multiple-choice shape
//   - explanation                        — fallback prose when no per-choice feedback
//   - choiceExplanations: { [id]: str }  — optional per-option reasoning
//   - required: boolean (default true)   — must be correct to mark lesson complete
function CheckBlock({ block, progress, onProgress }) {
  const saved = progress?.checkAnswers?.[block.id];
  // When the user has already answered correctly in a previous session,
  // we render the block in review mode — the choices are locked, the
  // outcome is summarized in the eyebrow, and the first wrong choice
  // (if any) is marked so review is useful.
  const inReviewMode = Boolean(saved?.correct);

  const [chosen,      setChosen]      = useState(saved?.chosenId ?? null);
  const [submitted,   setSubmitted]   = useState(Boolean(saved));
  const [showWhyNot,  setShowWhyNot]  = useState(false);
  const priorAttempts     = saved?.attempts ?? 0;
  const firstWrongChoice  = saved?.firstWrongChoice ?? null;

  const submit = () => {
    if (!chosen) return;
    const correct  = chosen === block.correct;
    const attempts = priorAttempts + 1;
    setSubmitted(true);
    // Preserve `firstWrongChoice` across retries — set once, never overwritten.
    const nextFirstWrong =
      firstWrongChoice ||
      (!correct ? chosen : null);
    onProgress?.({
      checkAnswers: {
        ...(progress?.checkAnswers ?? {}),
        [block.id]: {
          chosenId: chosen,
          correct,
          attempts,
          ...(nextFirstWrong ? { firstWrongChoice: nextFirstWrong } : {}),
        },
      },
    });
  };

  const retry = () => {
    setSubmitted(false);
    setShowWhyNot(false);
    // Keep `chosen` cleared so the user can pick again.
    setChosen(null);
  };

  const isCorrect = submitted && chosen === block.correct;
  const isWrong   = submitted && chosen !== block.correct;

  // Per-choice feedback (preferred) vs fallback to block-level explanation.
  const chosenExplanation =
    block.choiceExplanations?.[chosen] ||
    block.explanation ||
    "";

  // "Why not the others?" — the remaining choices with their individual
  // explanations. Only meaningful when choiceExplanations exists.
  const otherChoices = (block.choices ?? []).filter(c => c.id !== chosen);
  const hasPerChoiceFeedback = Boolean(block.choiceExplanations);

  return (
    <div className="reading-card rounded-xl p-5 space-y-4 my-2">
      <div className="flex items-center gap-2 eyebrow">
        <span>Checkpoint</span>
        {block.required === false && <span className="opacity-60">— optional</span>}
        {submitted && isCorrect && priorAttempts > 1 && (
          <span className="ml-auto text-[11px]" style={{ color: "hsl(40, 70%, 38%)" }}>
            Got it after {priorAttempts} {priorAttempts === 2 ? "try" : "tries"}
          </span>
        )}
        {submitted && isCorrect && priorAttempts === 1 && (
          <span className="ml-auto text-[11px]" style={{ color: "hsl(152, 45%, 35%)" }}>
            First try ✓
          </span>
        )}
      </div>

      <div className="text-[1.0625em] font-medium" style={{ color: "hsl(var(--reading-text))" }}>
        {inlineMd(block.question)}
      </div>

      <div className="space-y-2">
        {(block.choices ?? []).map(choice => {
          const isChosen          = chosen === choice.id;
          const isCorrectAnswer   = submitted && choice.id === block.correct;
          const isWrongChoice     = submitted && isChosen && choice.id !== block.correct;
          // In review mode, mark the first-wrong-choice too — shows the
          // learner what they were confused about even if they eventually
          // got it right.
          const isFirstWrongTrace =
            inReviewMode &&
            firstWrongChoice === choice.id &&
            choice.id !== block.correct;

          let borderColor = "hsl(var(--reading-border))";
          let bg          = "transparent";
          if (submitted) {
            if (isCorrectAnswer)       { borderColor = "hsla(152, 45%, 45%, 0.6)"; bg = "hsla(152, 45%, 55%, 0.08)"; }
            else if (isWrongChoice || isFirstWrongTrace) {
                                         borderColor = "hsla(0, 60%, 55%, 0.35)"; bg = "hsla(0, 60%, 55%, 0.04)"; }
          } else if (isChosen) {
            borderColor = "hsl(var(--reading-accent))";
            bg          = "hsla(250, 70%, 58%, 0.05)";
          }

          return (
            <button
              key={choice.id}
              onClick={() => !submitted && setChosen(choice.id)}
              disabled={submitted}
              className="w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-colors duration-150"
              style={{ borderColor, background: bg, cursor: submitted ? "default" : "pointer" }}
            >
              <span className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 text-[11px] font-semibold"
                style={{
                  borderColor: isChosen || isCorrectAnswer ? borderColor : "hsl(var(--reading-border))",
                  background:  isChosen && !submitted ? "hsl(var(--reading-accent))" : "transparent",
                  color:       isChosen && !submitted ? "white" : "hsl(var(--reading-secondary))",
                }}
              >
                {isCorrectAnswer ? <Check className="w-3 h-3" style={{ color: "hsl(152, 45%, 35%)" }} />
                 : (isWrongChoice || isFirstWrongTrace) ? <X className="w-3 h-3" style={{ color: "hsl(0, 60%, 50%)" }} />
                 : choice.id.toUpperCase()}
              </span>
              <span className="flex-1 text-[0.95em] leading-snug" style={{ color: "hsl(var(--reading-text))" }}>
                {inlineMd(choice.text)}
              </span>
              {isFirstWrongTrace && (
                <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold self-center"
                  style={{ color: "hsl(0, 50%, 50%)", opacity: 0.7 }}>
                  your first guess
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button onClick={submit} disabled={!chosen} className="btn btn-primary w-full md:w-auto">
          Check answer
        </button>
      ) : (
        <>
          {/* Feedback for the chosen answer */}
          <div
            className="rounded-lg p-4 text-[0.95em] leading-relaxed"
            style={{
              background: isCorrect ? "hsla(152, 45%, 55%, 0.08)" : "hsla(0, 60%, 55%, 0.06)",
              border:     `1px solid ${isCorrect ? "hsla(152, 45%, 45%, 0.35)" : "hsla(0, 60%, 55%, 0.3)"}`,
            }}
          >
            <div className="font-medium mb-1" style={{ color: isCorrect ? "hsl(152, 45%, 32%)" : "hsl(0, 60%, 42%)" }}>
              {isCorrect ? "Correct." : "Not quite."}
            </div>
            <div>{inlineMd(chosenExplanation)}</div>
            {isWrong && (
              <button
                onClick={retry}
                className="mt-3 text-[0.88em] font-medium underline underline-offset-2"
                style={{ color: "hsl(var(--reading-accent))" }}
              >
                Try again
              </button>
            )}
          </div>

          {/* Why not the other options? — only when per-choice feedback exists */}
          {hasPerChoiceFeedback && otherChoices.length > 0 && (
            <div className="pt-1">
              <button
                onClick={() => setShowWhyNot(v => !v)}
                className="text-[0.88em] font-medium flex items-center gap-1.5"
                style={{ color: "hsl(var(--reading-secondary))" }}
              >
                <span>{showWhyNot ? "Hide" : "Why weren't the others right?"}</span>
                <span style={{ transform: showWhyNot ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>↓</span>
              </button>
              {showWhyNot && (
                <div className="mt-3 space-y-3">
                  {otherChoices.map(c => {
                    const note = block.choiceExplanations?.[c.id];
                    if (!note) return null;
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg p-3.5 text-[0.9em] leading-relaxed"
                        style={{
                          background: "hsl(var(--reading-code-bg))",
                          border: "1px solid hsl(var(--reading-border))",
                        }}
                      >
                        <div className="font-medium mb-1" style={{ color: "hsl(var(--reading-text))" }}>
                          {c.id.toUpperCase()} · {inlineMd(c.text)}
                        </div>
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

// ─── PRACTICE (do-the-thing with optional length validation) ─
function PracticeBlock({ block, progress, onProgress }) {
  const saved = progress?.practiceEntries?.[block.id] ?? "";
  const [value, setValue] = useState(saved);
  const minLength = block.validation === "length" ? 40 : 0;
  const meetsMin  = value.trim().length >= minLength;

  const save = (v) => {
    setValue(v);
    onProgress?.({
      practiceEntries: { ...(progress?.practiceEntries ?? {}), [block.id]: v },
    });
  };

  return (
    <div className="reading-card rounded-xl p-5 space-y-3 my-2">
      <div className="eyebrow">Practice</div>
      <div className="text-[1.0625em] font-medium" style={{ color: "hsl(var(--reading-text))" }}>
        {inlineMd(block.instruction ?? "")}
      </div>
      {block.deliverable && (
        <div className="text-[0.9em] muted italic">Write: {block.deliverable}</div>
      )}
      <textarea
        value={value}
        onChange={(e) => save(e.target.value)}
        placeholder={block.placeholder ?? "Write your answer here…"}
        rows={5}
        className="w-full rounded-lg px-3.5 py-3 text-[0.95em] resize-y font-reading"
        style={{
          background: "hsl(var(--reading-surface))",
          border: "1px solid hsl(var(--reading-border))",
          color: "hsl(var(--reading-text))",
          fontFamily: "var(--font-reading)",
          lineHeight: 1.55,
        }}
      />
      {minLength > 0 && (
        <div className="text-[0.8em] muted">
          {meetsMin ? <span style={{ color: "hsl(152, 45%, 35%)" }}>✓ Long enough.</span> : `${value.trim().length} / ${minLength} chars`}
        </div>
      )}
    </div>
  );
}

// ─── WRITE (reflection, persists) ───────────────────────────
function WriteBlock({ block, progress, onProgress }) {
  const saved = progress?.writeEntries?.[block.id] ?? "";
  const [value, setValue] = useState(saved);
  const save = (v) => {
    setValue(v);
    onProgress?.({
      writeEntries: { ...(progress?.writeEntries ?? {}), [block.id]: v },
    });
  };
  return (
    <div className="reading-card rounded-xl p-5 space-y-3 my-2">
      <div className="eyebrow">Reflect</div>
      <div className="text-[1em]" style={{ color: "hsl(var(--reading-text))" }}>
        {inlineMd(block.content ?? "")}
      </div>
      <textarea
        value={value}
        onChange={(e) => save(e.target.value)}
        placeholder={block.placeholder ?? "Your thoughts…"}
        rows={4}
        className="w-full rounded-lg px-3.5 py-3 text-[0.95em] resize-y"
        style={{
          background: "hsl(var(--reading-surface))",
          border: "1px solid hsl(var(--reading-border))",
          color: "hsl(var(--reading-text))",
          fontFamily: "var(--font-reading)",
          lineHeight: 1.55,
        }}
      />
      <div className="text-[0.8em] muted">Saved as you type.</div>
    </div>
  );
}

// ─── REFERENCE ──────────────────────────────────────────────
function ReferenceBlock({ block }) {
  return (
    <a
      href={block.url}
      target="_blank"
      rel="noreferrer"
      className="reading-card rounded-xl p-4 flex items-start gap-3 no-underline hover:border-[hsl(var(--reading-accent))] transition-colors"
    >
      <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--reading-accent))" }} />
      <div className="flex-1">
        <div className="font-medium" style={{ color: "hsl(var(--reading-text))" }}>
          {block.title ?? block.url}
        </div>
        {block.note && <div className="text-[0.88em] mt-1 muted">{block.note}</div>}
      </div>
    </a>
  );
}

// ─── DIVIDER ────────────────────────────────────────────────
function DividerBlock() {
  return <hr className="my-2" style={{ border: "none", borderTop: "1px solid hsl(var(--reading-border))" }} />;
}

// ─── Block router ──────────────────────────────────────────
export default function Block({ block, progress, onProgress }) {
  switch (block.type) {
    case "heading":   return <HeadingBlock block={block} />;
    case "text":      return <TextBlock block={block} />;
    case "code":      return <CodeBlock block={block} />;
    case "example":   return <ExampleBlock block={block} />;
    case "callout":   return <CalloutBlock block={block} />;
    case "prompt":    return <PromptBlock block={block} />;
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

// Helper: given a lesson's blocks and progress, are all required checks passed?
export function allRequiredChecksPassed(blocks, progress) {
  const checks = blocks.filter(b => b.type === "check" && b.required !== false);
  if (checks.length === 0) return true;
  return checks.every(c => progress?.checkAnswers?.[c.id]?.correct === true);
}