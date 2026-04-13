import { TrendingUp, Clock, Trophy } from "lucide-react";

export default function Progress() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground">Your real-world ROI from AI missions.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center space-y-1">
          <Clock className="w-5 h-5 mx-auto text-win" />
          <div className="text-2xl font-bold">0 min</div>
          <div className="text-xs text-muted-foreground">Time Saved</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center space-y-1">
          <TrendingUp className="w-5 h-5 mx-auto text-xp" />
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-muted-foreground">Total XP</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-streak" />
          <span className="text-sm font-semibold">Badges</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Complete missions to earn your first badge.
        </p>
      </div>
    </div>
  );
}