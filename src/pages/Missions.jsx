import { useOutletContext, useNavigate } from "react-router-dom";
import { Zap, BookOpen, Clock, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["All", "prompting", "writing", "research", "automation", "rag", "python", "data", "productivity"];

const CATEGORY_COLORS = {
  prompting:   "#00f5ff",
  writing:     "#39ff14",
  research:    "#a78bfa",
  automation:  "#f472b6",
  rag:         "#fb923c",
  python:      "#fbbf24",
  data:        "#60a5fa",
  productivity:"#34d399",
};

export default function Missions() {
  const { deepDive } = useOutletContext() || {};
  const navigate = useNavigate();

  const [missions,        setMissions]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activeCategory,  setActiveCategory]  = useState("All");
  const [search,          setSearch]          = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const type = deepDive ? "deep-dive" : "quick-win";
        const all = await base44.entities.Mission.filter({ type });
        setMissions(all);
      } catch (_) {}
      setLoading(false);
    })();
  }, [deepDive]);

  const filtered = missions.filter(m => {
    const catMatch = activeCategory === "All" || m.category === activeCategory;
    const searchMatch = !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description ?? "").toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="px-4 py-5 space-y-4 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Missions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pick one. Apply it. Log the win.</p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
          style={deepDive
            ? { background: "rgba(57,255,20,0.12)", color: "#39ff14" }
            : { background: "rgba(0,245,255,0.12)", color: "#00f5ff" }}>
          {deepDive ? <BookOpen className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {deepDive ? "Deep Dive" : "Quick-Win"}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search missions…"
          className="w-full bg-secondary rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#00f5ff] transition-colors placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn("shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
              activeCategory === cat ? "text-black border-transparent" : "bg-secondary text-muted-foreground border-border"
            )}
            style={activeCategory === cat ? { background: CATEGORY_COLORS[cat] ?? "#00f5ff" } : {}}>
            {cat}
          </button>
        ))}
      </div>

      {/* Mission list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No missions found 🔍
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(mission => {
            const color = CATEGORY_COLORS[mission.category] ?? "#00f5ff";
            return (
              <div
                key={mission.id}
                onClick={() => navigate(`/mission/${mission.id}`)}
                className="rounded-3xl border bg-card p-4 space-y-3 active:scale-[0.98] transition-transform cursor-pointer"
                style={{ borderColor: `${color}30` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                      style={{ background: `${color}22`, color }}
                    >
                      {mission.category}
                    </span>
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
                      {mission.durationMinutes ?? 3} min
                    </span>
                    <span className="font-bold text-[#39ff14]">+{mission.xpReward} XP</span>
                  </div>
                  <button
                    className="px-4 py-1.5 rounded-xl text-xs font-black text-black"
                    style={{ background: color, boxShadow: `0 0 10px ${color}55` }}
                  >
                    Start →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}