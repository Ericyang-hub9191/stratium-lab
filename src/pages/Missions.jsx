import { useOutletContext } from "react-router-dom";
import { Zap, BookOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "prompting", "writing", "research", "automation", "python"];

export default function Missions() {
  const { deepDive } = useOutletContext() || {};
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black">Missions</h1>
        <p className="text-sm text-muted-foreground">Pick one. Apply it. Log the win.</p>
      </div>

      <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
        style={deepDive
          ? { background: "rgba(57,255,20,0.12)", color: "#39ff14" }
          : { background: "rgba(0,245,255,0.12)", color: "#00f5ff" }}>
        {deepDive ? <BookOpen className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
        {deepDive ? "Deep Dive" : "Quick-Win"} missions
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CATEGORIES.map(cat => (
          <button key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn("shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
              activeCategory === cat ? "text-black border-transparent" : "bg-secondary text-muted-foreground border-border"
            )}
            style={activeCategory === cat ? { background: "#00f5ff" } : {}}>
            {cat}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Missions load here once the library is seeded 🚀
      </p>
    </div>
  );
}