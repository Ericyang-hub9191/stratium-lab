import { Flame, Shield } from "lucide-react";

export default function StreakPage() {
  return (
    <div className="px-4 py-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-streak to-orange-400 flex items-center justify-center animate-streak-fire">
          <Flame className="w-10 h-10 text-white" />
        </div>
        <div>
          <div className="text-5xl font-black text-streak">0</div>
          <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-muted-foreground">Longest Streak</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-muted-foreground">Total Wins</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <div className="text-sm font-semibold">3 Streak Freezes</div>
          <div className="text-xs text-muted-foreground">Miss a day without losing your streak</div>
        </div>
      </div>
    </div>
  );
}