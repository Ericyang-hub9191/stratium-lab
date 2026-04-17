import { BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";

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
    if (m.totalLessons) map[key].totalLessons = m.totalLessons;
  });
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

  const ctaLabel = isComplete
    ? "🎓 Review Journey"
    : isStarted
    ? "Continue Journey →"
    : "Start Journey →";

  const progressLabel = isComplete
    ? `All ${total} lessons complete`
    : isStarted
    ? `Lesson ${completedCount + 1} of ${total} • ${pct}% complete`
    : `${total} lessons • ${journey.xpReward} XP total`;

  return (
    <div
      onClick={() => onClick(nextLesson)}
      className="rounded-2xl cursor-pointer active:scale-[0.985] transition-all duration-150 overflow-hidden"
      style={{
        border: `1px solid ${color}30`,
        background: "hsl(var(--card))",
        boxShadow: `0 2px 20px ${color}0a`,
      }}
    >
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mt-0.5"
            style={{ background: `${color}18` }}
          >
            <BookOpen className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: `${color}20`, color }}
              >
                {journey.category}
              </span>
              {isComplete && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(57,255,20,0.15)", color: "#39ff14" }}>
                  ✅ Mastered
                </span>
              )}
              {isStarted && !isComplete && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>
                  In Progress
                </span>
              )}
            </div>
            <h3 className="text-base font-black leading-snug">{journey.journeyTitle}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {journey.journeyDescription}
            </p>
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">{progressLabel}</span>
            {isStarted && !isComplete && (
              <span className="font-black" style={{ color }}>{pct}%</span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`,
                background: isComplete
                  ? "linear-gradient(90deg, #39ff14, #00f5ff)"
                  : `linear-gradient(90deg, ${color}ee, ${color}77)`,
              }}
            />
          </div>
        </div>

        {/* Lesson dots */}
        <div className="flex gap-1.5 flex-wrap">
          {journey.lessons.slice(0, 10).map((lesson, i) => {
            const done = completedIds.includes(lesson.id);
            const isNext = lesson.id === nextLesson?.id && !isComplete;
            return (
              <div
                key={lesson.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border transition-all"
                title={lesson.unitTitle || lesson.title}
                style={
                  done
                    ? { background: `${color}28`, borderColor: color, color }
                    : isNext
                    ? { background: color, borderColor: color, color: "#000" }
                    : { background: "transparent", borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {done ? <CheckCircle2 className="w-3 h-3" /> : isNext ? "▶" : i + 1}
              </div>
            );
          })}
          {journey.lessons.length > 10 && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border border-border text-muted-foreground">
              +{journey.lessons.length - 10}
            </div>
          )}
        </div>

        {/* Encouragement */}
        {isStarted && !isComplete && (
          <p className="text-xs font-semibold" style={{ color: "#39ff14" }}>
            🔥 Great work — you're building real mastery. Keep the momentum!
          </p>
        )}

        {/* CTA button */}
        <button
          className="w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95"
          style={isComplete
            ? { background: `${color}18`, color, border: `1px solid ${color}40` }
            : { background: color, color: "#000", boxShadow: `0 0 16px ${color}44` }
          }
        >
          {ctaLabel}
          {!isComplete && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}