import { useOutletContext, useNavigate } from "react-router-dom";
import { Zap, BookOpen, Clock, Search, Map, Flame, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import DeepDiveCard, { groupIntoJourneys } from "@/components/DeepDiveCard";

const QUICK_BOOST_CATEGORIES = ["All", "prompting", "writing", "research", "automation", "python", "data", "productivity"];
const DEEP_DIVE_CATEGORIES   = ["All", "prompting", "research", "python", "business", "biology", "safety", "psychology", "mlops"];

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

export default function Missions() {
  const { deepDive } = useOutletContext() || {};
  const navigate = useNavigate();

  const [missions,       setMissions]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search,         setSearch]         = useState("");
  const [completedIds,   setCompletedIds]   = useState([]);

  useEffect(() => {
    setActiveCategory("All");
    setSearch("");
  }, [deepDive]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const type = deepDive ? "deep-dive" : "quick-boost";
        const [all, user] = await Promise.all([
          base44.entities.Mission.filter({ type }),
          base44.auth.me().catch(() => null),
        ]);
        setMissions(all);

        if (user) {
          const progress = await base44.entities.UserProgress.filter({ userId: user.id });
          setCompletedIds(progress[0]?.completedMissionIds ?? []);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, [deepDive]);

  // ── Quick Boost filtering ─────────────────────────────────────────
  const filteredBoosts = missions.filter(m => {
    const catMatch = activeCategory === "All" || m.category === activeCategory;
    const searchMatch = !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description ?? "").toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  // ── Deep Dive journey grouping + filtering ────────────────────────
  const allJourneys = groupIntoJourneys(missions);
  const filteredJourneys = allJourneys.filter(j => {
    const catMatch = activeCategory === "All" || j.category === activeCategory;
    const searchMatch = !search ||
      j.journeyTitle.toLowerCase().includes(search.toLowerCase()) ||
      (j.journeyDescription ?? "").toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="px-4 py-5 space-y-4 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">
            {deepDive ? "Learning Journeys" : "Quick Boosts"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {deepDive
              ? "Multi-lesson mastery paths — progress at your own pace."
              : "Pick one. Apply it. Log the impact."}
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
          style={deepDive
            ? { background: "rgba(57,255,20,0.12)", color: "#39ff14" }
            : { background: "rgba(0,245,255,0.12)", color: "#00f5ff" }}
        >
          {deepDive ? <Map className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {deepDive ? "Deep Dive" : "Quick Boost"}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={deepDive ? "Search journeys…" : "Search boosts…"}
          className="w-full bg-secondary rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#00f5ff] transition-colors placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {(deepDive ? DEEP_DIVE_CATEGORIES : QUICK_BOOST_CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
              activeCategory === cat
                ? "text-black border-transparent"
                : "bg-secondary text-muted-foreground border-border"
            )}
            style={activeCategory === cat ? { background: CATEGORY_COLORS[cat] ?? "#00f5ff" } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Deep Dive: Journey cards ── */}
      {deepDive && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-border border-t-[#39ff14] rounded-full animate-spin" />
            </div>
          ) : filteredJourneys.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">No journeys found 🗺️</div>
          ) : (
            <div className="space-y-4">
              {/* Journey stats bar */}
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">
                  {filteredJourneys.length} journey{filteredJourneys.length !== 1 ? "s" : ""} available
                </p>
                {completedIds.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#39ff14" }}>
                    <Trophy className="w-3 h-3" />
                    {completedIds.length} lessons complete
                  </div>
                )}
              </div>
              {/* Encouraging message */}
              {(() => {
                const startedJourneys = filteredJourneys.filter(j => j.lessons.some(l => completedIds.includes(l.id)));
                if (startedJourneys.length > 0) {
                  return (
                    <div className="rounded-2xl px-4 py-3 text-xs font-bold text-center"
                      style={{ background: "rgba(57,255,20,0.08)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.2)" }}>
                      🔥 You're building real mastery — keep going, you're leveling up!
                    </div>
                  );
                }
                return (
                  <div className="rounded-2xl px-4 py-3 text-xs font-bold text-center"
                    style={{ background: "rgba(0,245,255,0.06)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.2)" }}>
                    🗺️ Each journey takes days or weeks — real mastery, not shortcuts.
                  </div>
                );
              })()}
              {filteredJourneys.map(journey => (
                <DeepDiveCard
                  key={journey.journeyId}
                  journey={journey}
                  completedIds={completedIds}
                  onClick={lesson => navigate(`/mission/${lesson.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Quick Boost: Individual cards ── */}
      {!deepDive && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
            </div>
          ) : filteredBoosts.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No boosts found 🔍
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBoosts.map(mission => {
                const color = CATEGORY_COLORS[mission.category] ?? "#00f5ff";
                const done = completedIds.includes(mission.id);
                return (
                  <div
                    key={mission.id}
                    onClick={() => navigate(`/mission/${mission.id}`)}
                    className="rounded-3xl border bg-card p-4 space-y-3 active:scale-[0.98] transition-transform cursor-pointer"
                    style={{ borderColor: `${color}30`, opacity: done ? 0.6 : 1 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${color}22`, color }}
                          >
                            {mission.category}
                          </span>
                          {done && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(57,255,20,0.15)", color: "#39ff14" }}>
                              ✓ Done
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black leading-snug">{mission.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {mission.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mission.durationMinutes ?? 4} min
                        </span>
                        <span className="font-bold text-[#39ff14]">+{mission.xpReward} XP</span>
                      </div>
                      <button
                        className="px-4 py-1.5 rounded-xl text-xs font-black text-black"
                        style={{ background: color, boxShadow: `0 0 10px ${color}55` }}
                      >
                        {done ? "Review →" : "Start →"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}