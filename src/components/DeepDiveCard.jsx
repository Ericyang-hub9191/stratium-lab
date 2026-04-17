import { BookOpen, ChevronRight, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// Human-readable journey titles keyed by journeyId
const JOURNEY_NAMES = {
  "ai-101-foundations":           "AI Foundations",
  "ai-201-llm-mastery":          "LLM Mastery",
  "ai-301-prompting-pro":        "Prompting Pro",
  "ai-302-strategy-frontier":    "AI Strategy & Frontier Intelligence",
  "ai-303-business-strategy":    "AI in Business & Strategy",
  "ai-401-build-ai":             "Build Your Own AI",
  "ai-402-python-for-ai":        "Python for AI",
  "ai-403-rag-systems":          "RAG Systems",
  "ai-501-ai-biology":           "AI in Biology",
  "ai-502-ai-psychology":        "AI in Psychology",
  "ai-503-ai-safety":            "AI Safety & Alignment",
  "ai-504-mlops":                "AI Deployment & MLOps",
};

const JOURNEY_EMOJIS = {
  "ai-101-foundations":          "🧠",
  "ai-201-llm-mastery":         "⚡",
  "ai-301-prompting-pro":       "💬",
  "ai-302-strategy-frontier":   "🔭",
  "ai-303-business-strategy":   "📈",
  "ai-401-build-ai":            "🔨",
  "ai-402-python-for-ai":       "🐍",
  "ai-403-rag-systems":         "📚",
  "ai-501-ai-biology":          "🧬",
  "ai-502-ai-psychology":       "🧩",
  "ai-503-ai-safety":           "🛡️",
  "ai-504-mlops":               "🚀",
};

const CATEGORY_COLORS = {
  prompting:   "#00f5ff",
  writing:     "#39ff14",
  research:    "#a78bfa",
  automation:  "#f472b6",
  rag:         "#fb923c",
  python:      "#fbbf24",
  data:        "#60a5fa",
  productivity:"#34d399",
  business:    "#f59e0b",
  biology:     "#4ade80",
  safety:      "#f87171",
  psychology:  "#c084fc",
  mlops:       "#38bdf8",
};

// Groups an array of lessons by journeyId, returns array of journey objects
export function groupIntoJourneys(missions) {
  const map = {};
  missions.forEach(m => {
    const key = m.journeyId || m.id;
    if (!map[key]) {
      // Derive a clean journey title: prefer the lookup map, then journeyDescription prefix, then journeyId slug
      const lookupTitle = JOURNEY_NAMES[key];
      const slugTitle = key.replace(/-/g, " ").replace(/^ai \d+ /i, "").replace(/\b\w/g, c => c.toUpperCase());
      map[key] = {
        journeyId:          key,
        journeyTitle:       lookupTitle || slugTitle,
        journeyEmoji:       JOURNEY_EMOJIS[key] || "🗺️",
        journeyDescription: m.journeyDescription || m.description,
        category:           m.category,
        totalLessons:       m.totalLessons || 1,
        xpReward:           0,
        lessons:            [],
        tags:               m.tags || [],
      };
    }
    map[key].lessons.push(m);
    map[key].xpReward += m.xpReward || 0;
    // Keep totalLessons as the declared value (most reliable)
    if (m.totalLessons) map[key].totalLessons = m.totalLessons;
  });
  // Sort lessons within each journey
  Object.values(map).forEach(j => {
    j.lessons.sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
  });
  return Object.values(map);
}

export default function DeepDiveCard({ journey, completedIds = [], onClick }) {
  const color = CATEGORY_COLORS[journey.category] ?? "#a78bfa";
  const completedCount = journey.lessons.filter(l => completedIds.includes(l.id)).length;
  const total = journey.totalLessons || journey.lessons.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const nextLesson = journey.lessons.find(l => !completedIds.includes(l.id)) || journey.lessons[0];
  const isStarted = completedCount > 0;
  const isComplete = completedCount >= total;

  const encouragements = [
    "You're building real mastery 🔥",
    "Keep going — you're leveling up! ⚡",
    "Great progress — don't stop now!",
    "You're in the zone. Stay consistent 💪",
  ];
  const encouragement = encouragements[completedCount % encouragements.length];

  const statusLabel = isComplete
    ? "✅ Mastered"
    : isStarted
    ? `Lesson ${completedCount + 1} of ${total}`
    : `${total} lessons`;

  return (
    <div
      onClick={() => onClick(nextLesson)}
      className="rounded-3xl border bg-card active:scale-[0.98] transition-transform cursor-pointer overflow-hidden"
      style={{
        borderColor: `${color}40`,
        boxShadow: isStarted ? `0 0 20px ${color}12` : undefined,
      }}
    >
      {/* Colored top accent strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

      <div className="p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Emoji + Title */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl leading-none">{journey.journeyEmoji}</span>
            <h3 className="text-lg font-black leading-snug">{journey.journeyTitle}</h3>
          </div>
          {/* Tags row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: `${color}22`, color }}
            >
              {journey.category}
            </span>
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              style={{
                background: isComplete
                  ? "rgba(57,255,20,0.15)"
                  : isStarted
                  ? "rgba(251,146,60,0.15)"
                  : "rgba(255,255,255,0.06)",
                color: isComplete ? "#39ff14" : isStarted ? "#fb923c" : "#888",
              }}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {journey.journeyDescription}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isComplete
                ? "linear-gradient(90deg, #39ff14, #00f5ff)"
                : `linear-gradient(90deg, ${color}, ${color}99)`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{completedCount} / {total} lessons complete</span>
          <span className="font-semibold" style={{ color }}>
            {journey.xpReward} XP total
          </span>
        </div>
      </div>

      {/* Lesson chips */}
      <div className="flex gap-1.5 flex-wrap">
        {journey.lessons.slice(0, 8).map((lesson, i) => {
          const done = completedIds.includes(lesson.id);
          const isNext = lesson.id === nextLesson?.id && !isComplete;
          return (
            <div
              key={lesson.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all"
              style={
                done
                  ? { background: `${color}30`, borderColor: color, color }
                  : isNext
                  ? { background: color, borderColor: color, color: "#000" }
                  : { background: "transparent", borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
              }
            >
              {done ? "✓" : isNext ? "▶" : i + 1}
            </div>
          );
        })}
        {journey.lessons.length > 8 && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-border text-muted-foreground">
            +{journey.lessons.length - 8}
          </div>
        )}
      </div>

      {/* Encouraging message when in progress */}
      {isStarted && !isComplete && (
        <p className="text-[10px] font-bold px-1" style={{ color: "#39ff14" }}>{encouragement}</p>
      )}

      {/* CTA */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{ background: `${color}12`, border: `1px solid ${color}25` }}
      >
        <div>
          <p className="text-xs font-black" style={{ color }}>
            {isComplete ? "🎓 Journey Complete!" : isStarted ? "▶ Continue Journey" : "🚀 Start Journey"}
          </p>
          {!isComplete && nextLesson && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[220px]">
              {nextLesson.unitTitle || nextLesson.title}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5" style={{ color }} />
      </div>
      </div>
    </div>
  );
}