import { BookOpen, ChevronRight, Star, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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
      map[key] = {
        journeyId:          key,
        journeyTitle:       m.title.replace(/: Lesson \d+.*$/, "").replace(/ — Unit.*$/, ""),
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

  const statusLabel = isComplete
    ? "✅ Mastered"
    : isStarted
    ? `Lesson ${completedCount + 1} of ${total}`
    : `${total} lessons`;

  return (
    <div
      onClick={() => onClick(nextLesson)}
      className="rounded-3xl border bg-card p-5 space-y-4 active:scale-[0.98] transition-transform cursor-pointer"
      style={{ borderColor: `${color}35` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
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
          <h3 className="text-base font-black leading-snug">{journey.journeyTitle}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {journey.journeyDescription}
          </p>
        </div>
        <div
          className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <BookOpen className="w-5 h-5" style={{ color }} />
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

      {/* CTA */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{ background: `${color}12` }}
      >
        <div>
          <p className="text-xs font-black" style={{ color }}>
            {isComplete ? "🎓 Journey Complete!" : isStarted ? "▶ Continue Journey" : "🚀 Start Journey"}
          </p>
          {!isComplete && nextLesson && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">
              {nextLesson.unitTitle || nextLesson.title}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  );
}