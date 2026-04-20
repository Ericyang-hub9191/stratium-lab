/* ─────────────────────────────────────────────────────────────
   Library — browse all Journeys and Boosts.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, BookOpen, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const JOURNEY_TRACKS   = ["all", "prompting", "writing", "research", "automation", "python", "data", "rag", "business", "biology", "safety", "psychology", "mlops", "build-your-own"];
const BOOST_CATEGORIES = ["all", "prompting", "writing", "research", "automation", "python", "data", "productivity", "rag"];
const DIFFICULTY_LABEL = { intro: "Intro", core: "Core", advanced: "Advanced" };

export default function Library() {
  const navigate = useNavigate();
  const [tab, setTab]         = useState("journeys");
  const [filter, setFilter]   = useState("all");
  const [query, setQuery]     = useState("");
  const [journeys, setJourneys] = useState([]);
  const [boosts, setBoosts]   = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [j, b, user] = await Promise.all([
          base44.entities.Journey.filter({ isPublished: true }),
          base44.entities.Boost.filter({ isPublished: true }),
          base44.auth.me().catch(() => null),
        ]);
        if (cancelled) return;
        setJourneys(j);
        setBoosts(b);
        if (user) {
          const p = await base44.entities.UserProgress.filter({ userId: user.id });
          if (!cancelled) setProgress(p);
        }
      } catch (e) {
        console.error("Library load failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setFilter("all"); }, [tab]);

  const completedSet = useMemo(() => {
    const s = { lesson: new Set(), boost: new Set() };
    progress.forEach(p => {
      if (p.status === "completed") {
        if (p.contentType === "lesson") s.lesson.add(p.contentId);
        if (p.contentType === "boost")  s.boost.add(p.contentId);
      }
    });
    return s;
  }, [progress]);

  const filteredJourneys = useMemo(() => {
    let list = journeys;
    if (filter !== "all") list = list.filter(j => j.track === filter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(j =>
        j.title.toLowerCase().includes(q) ||
        (j.summary ?? "").toLowerCase().includes(q) ||
        (j.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [journeys, filter, query]);

  const filteredBoosts = useMemo(() => {
    let list = boosts;
    if (filter !== "all") list = list.filter(b => b.category === filter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.subtitle ?? "").toLowerCase().includes(q) ||
        (b.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [boosts, filter, query]);

  const filterOptions = tab === "journeys" ? JOURNEY_TRACKS : BOOST_CATEGORIES;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <div className="space-y-1">
        <div className="ui-eyebrow">Library</div>
        <h1 className="text-2xl md:text-3xl ui-heading">Everything to learn</h1>
      </div>

      <div className="flex border-b border-border">
        {[
          { id: "journeys", label: "Journeys", count: journeys.length },
          { id: "boosts",   label: "Boosts",   count: boosts.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-accent text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {t.label} <span className="ml-1 text-text-muted text-xs">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="w-full bg-surface-1 border border-border rounded-md pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        {filterOptions.map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={cn(
              "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors capitalize",
              filter === opt
                ? "border-accent bg-[hsla(var(--accent),0.12)] text-text-primary"
                : "border-border bg-transparent text-text-secondary hover:border-border-strong hover:text-text-primary"
            )}
          >
            {opt === "all" ? "All" : opt}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" />
        </div>
      ) : tab === "journeys" ? (
        filteredJourneys.length === 0
          ? <EmptyState label="No journeys match your filters." />
          : <div className="space-y-2">{filteredJourneys.map(j => <JourneyCard key={j.id} journey={j} navigate={navigate} />)}</div>
      ) : (
        filteredBoosts.length === 0
          ? <EmptyState label="No boosts match your filters." />
          : <div className="space-y-2">{filteredBoosts.map(b => <BoostCard key={b.id} boost={b} done={completedSet.boost.has(b.id)} navigate={navigate} />)}</div>
      )}
    </div>
  );
}

function JourneyCard({ journey, navigate }) {
  return (
    <div
      onClick={() => navigate(`/journey/${journey.slug}`)}
      className="cursor-pointer rounded-lg border border-border bg-surface-1 p-4 hover:border-border-strong transition-colors"
    >
      <div className="flex items-start gap-3">
        <BookOpen className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="ui-eyebrow !text-text-muted">{journey.track}</span>
            {journey.difficulty && <span className="ui-eyebrow !text-text-muted">· {DIFFICULTY_LABEL[journey.difficulty] ?? journey.difficulty}</span>}
          </div>
          <h3 className="text-base font-medium text-text-primary leading-snug">{journey.title}</h3>
          {journey.subtitle && <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-2">{journey.subtitle}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
            <span>{journey.totalLessons} lesson{journey.totalLessons === 1 ? "" : "s"}</span>
            {journey.estimatedHours && <><span>·</span><span>~{journey.estimatedHours}h</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoostCard({ boost, done, navigate }) {
  return (
    <div
      onClick={() => navigate(`/boost/${boost.id}`)}
      className="cursor-pointer rounded-lg border border-border bg-surface-1 p-4 hover:border-border-strong transition-colors"
    >
      <div className="flex items-start gap-3">
        <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="ui-eyebrow !text-text-muted">{boost.category}</span>
            {done && <span className="ui-eyebrow text-success">· Done</span>}
          </div>
          <h3 className="text-base font-medium text-text-primary leading-snug">{boost.title}</h3>
          {boost.subtitle && <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-1">{boost.subtitle}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{boost.estimatedMinutes ?? 4} min</span>
            <span>·</span>
            <span>+{boost.xpReward ?? 40} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 py-12 text-center">
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}