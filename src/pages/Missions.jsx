import { useOutletContext } from "react-router-dom";
import { Zap, Clock, BookOpen, Filter } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "prompting", "writing", "research", "automation", "python"];

export default function Missions() {
  const { deepDive } = useOutletContext() || {};
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Missions</h1>
          <p className="text-sm text-muted-foreground">
            Pick a mission. Apply it. Log the win.
          </p>
        </div>
        <button className="p-2 rounded-xl border bg-secondary">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Type toggle indicator */}
      <div
        className="text-xs font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-1.5"
        style={
          deepDive
            ? { background: "rgba(57,255,20,0.12)", color: "#39ff14" }
            : { background: "rgba(0,245,255,0.12)", color: "#00f5ff" }
        }
      >
        {deepDive ? <BookOpen className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
        Showing {deepDive ? "Deep Dive" : "Quick-Win"} missions
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
              activeCategory === cat
                ? "text-black border-transparent"
                : "bg-secondary text-muted-foreground border-border"
            )}
            style={
              activeCategory === cat ? { background: "#00f5ff" } : {}
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mission cards placeholder */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border bg-card p-4 space-y-3 opacity-40"
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(0,245,255,0.15)", color: "#00f5ff" }}
              >
                <Zap className="w-3 h-3" /> Quick-Win
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> 3 min · 50 XP
              </span>
            </div>
            <div className="h-4 bg-secondary rounded-full w-3/4 animate-pulse" />
            <div className="h-3 bg-secondary rounded-full w-full animate-pulse" />
            <div className="h-3 bg-secondary rounded-full w-2/3 animate-pulse" />
          </div>
        ))}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Missions load here once the library is seeded 🚀
        </p>
      </div>
    </div>
  );
}