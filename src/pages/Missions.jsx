import { Zap, Clock } from "lucide-react";

export default function Missions() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Missions</h1>
        <p className="text-sm text-muted-foreground">Pick a mission. Apply it. Log the win.</p>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          Quick-Win
        </button>
        <button className="px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
          Deep Dive
        </button>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Zap className="w-3 h-3" /> Quick-Win
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> 3 min
            </span>
          </div>
          <h3 className="font-semibold text-sm">No missions yet</h3>
          <p className="text-xs text-muted-foreground">
            Missions will appear here once they're loaded.
          </p>
        </div>
      </div>
    </div>
  );
}