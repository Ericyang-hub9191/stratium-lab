import { Flame, Zap, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
          <Flame className="w-12 h-12 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Synthetica</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          3-minute AI missions. Real wins. Unbreakable streaks.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          to="/missions"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:opacity-90 transition"
        >
          <Zap className="w-4 h-4" /> Start a Mission
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 pt-4 text-center">
        <div>
          <div className="text-2xl font-bold text-streak">0</div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-xp">0</div>
          <div className="text-xs text-muted-foreground">Total XP</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-win">0</div>
          <div className="text-xs text-muted-foreground">Wins</div>
        </div>
      </div>
    </div>
  );
}