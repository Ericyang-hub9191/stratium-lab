/* ─────────────────────────────────────────────────────────────
   OnboardingModal — first-run personalization.
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";

const TRACK_OPTIONS = [
  { id: "prompting",       label: "Better prompting",          desc: "Day-to-day skill for any AI tool" },
  { id: "writing",         label: "Writing with AI",           desc: "Drafts, edits, voice" },
  { id: "research",        label: "Research & summarization",  desc: "Reading, condensing, fact-finding" },
  { id: "automation",      label: "Automation",                desc: "Repetitive work, scripts, workflows" },
  { id: "python",          label: "Python with AI",            desc: "Code with AI as a pair" },
  { id: "data",            label: "Data analysis",             desc: "Spreadsheets, queries, charts" },
  { id: "business",        label: "Business strategy",         desc: "Planning, decisions, frameworks" },
  { id: "biology",         label: "AI in biology",             desc: "Scientific applications" },
  { id: "psychology",      label: "AI in psychology",          desc: "Behavior, cognition, research" },
  { id: "safety",          label: "Safety & alignment",        desc: "How models can fail and how to think about it" },
  { id: "mlops",           label: "MLOps",                     desc: "Production ML systems" },
  { id: "build-your-own",  label: "Build your own AI",         desc: "APIs, agents, RAG" },
];

export default function OnboardingModal({ onDone }) {
  const [slide, setSlide] = useState(0);
  const [selected, setSelected] = useState([]);

  const totalSlides = 3;
  const isLast = slide === totalSlides - 1;

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const next = () => {
    if (isLast) {
      onDone({ tracks: selected });
    } else {
      setSlide(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg p-6 md:p-8 space-y-6 animate-slide-up">

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === slide ? 24 : 6,
                height: 6,
                background: i <= slide ? "hsl(var(--accent))" : "hsl(var(--surface-2))",
              }}
            />
          ))}
        </div>

        {slide === 0 && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl ui-heading">Welcome to Synthetica.</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              A serious tool for getting better at using AI. Two formats: short Boosts you can do in 3 minutes, and longer Journeys that build real depth.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every lesson has a checkpoint — not to test you, but to make sure something actually stuck.
            </p>
          </div>
        )}

        {slide === 1 && (
          <div className="space-y-4">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl ui-heading">What do you want to learn?</h2>
              <p className="text-sm text-text-secondary">Pick any number. We'll use this to recommend journeys and boosts. You can change it later.</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {TRACK_OPTIONS.map(opt => {
                const on = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className={`text-left rounded-lg p-3 border transition-colors duration-150 ${
                      on
                        ? "border-accent bg-[hsla(var(--accent),0.08)]"
                        : "border-border bg-surface-1 hover:border-border-strong"
                    }`}
                  >
                    <div className="text-sm font-medium text-text-primary">{opt.label}</div>
                    <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
            {selected.length === 0 && (
              <p className="text-xs text-text-muted text-center">You can also skip — we'll show you everything.</p>
            )}
          </div>
        )}

        {slide === 2 && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl ui-heading">One last thing.</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Streaks here aren't a punishment system. The point is the work, not the number. Come back when you can — but try to come back.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              When you finish a lesson, the answer to "did I really learn that?" lives in the checkpoint. Take it seriously.
            </p>
          </div>
        )}

        <button onClick={next} className="btn btn-primary w-full">
          {isLast ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}