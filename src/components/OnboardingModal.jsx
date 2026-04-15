import { useState } from "react";

const SLIDES = [
  {
    emoji: "⚡",
    title: "Welcome to Synthetica",
    body: ["Build real AI skills through daily practice — not theory.", "Every session makes you measurably better."],
  },
  {
    emoji: "🔥",
    title: "Your streak is everything",
    body: ["Complete one Boost every day to keep your streak alive.", "Miss a day and it resets. Consistency is the skill."],
  },
  {
    emoji: "🗺️",
    title: "Two modes, one goal",
    body: ["Quick Boost: 3–5 minutes, apply it today. Deep Dive: multi-lesson journeys for real mastery.", "Toggle between them anytime at the top."],
  },
];

export default function OnboardingModal({ onDismiss }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  const { emoji, title, body } = SLIDES[slide];

  const handleNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      setSlide(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-3xl border overflow-hidden"
        style={{ background: "hsl(var(--background))", borderColor: "rgba(0,245,255,0.25)", boxShadow: "0 0 60px rgba(0,245,255,0.1)" }}
      >
        <div className="p-7 space-y-6 text-center">
          {/* Emoji */}
          <div className="text-6xl leading-none">{emoji}</div>

          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-xl font-black">{title}</h2>
            {body.map((line, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === slide ? 20 : 6,
                  height: 6,
                  background: i === slide ? "#00f5ff" : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl text-base font-black text-black transition-all active:scale-95"
            style={isLast ? {
              background: "linear-gradient(90deg, #39ff14, #00f5ff)",
              boxShadow: "0 0 24px rgba(57,255,20,0.4)",
            } : {
              background: "#00f5ff",
              boxShadow: "0 0 20px rgba(0,245,255,0.35)",
            }}
          >
            {isLast ? "Let's go ⚡" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}