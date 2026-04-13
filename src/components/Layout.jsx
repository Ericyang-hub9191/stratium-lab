import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Zap, Flame, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const TABS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/missions", icon: Zap, label: "Missions" },
  { path: "/streak", icon: Flame, label: "Streak" },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
  { path: "/me", icon: User, label: "Me" },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [deepDive, setDeepDive] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const [streaks, stats] = await Promise.all([
          base44.entities.Streak.filter({ userId: user.id }),
          base44.entities.UserStats.filter({ userId: user.id }),
        ]);
        if (streaks[0]) setStreak(streaks[0].currentStreak ?? 0);
        if (stats[0]) setXp(stats[0].totalXp ?? 0);
      } catch (_) {}
    })();
  }, []);

  const isHighStreak = streak >= 7;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between gap-2">

        {/* Streak flame */}
        <button className="flex items-center gap-2 select-none">
          <span
            className={cn("text-3xl leading-none transition-all duration-300", isHighStreak ? "animate-streak-fire" : "animate-bounce")}
            style={isHighStreak ? {
              filter: "drop-shadow(0 0 10px #ff6b35) drop-shadow(0 0 20px #ff6b35)",
            } : {}}
          >
            🔥
          </span>
          <span className="text-2xl font-black tabular-nums leading-none text-[#00f5ff]">
            {streak}
          </span>
          <span className="text-xs text-muted-foreground font-medium">streak</span>
        </button>

        {/* Deep Dive toggle pill */}
        <button
          onClick={() => setDeepDive(v => !v)}
          className="relative flex items-center rounded-full border transition-colors duration-300 p-1 select-none"
          style={{ borderColor: deepDive ? "#39ff14" : "#00f5ff", minWidth: 148 }}
          aria-label="Toggle mission mode"
        >
          {/* Sliding background pill */}
          <span
            className="absolute top-1 bottom-1 rounded-full transition-all duration-300"
            style={{
              width: "calc(50% - 4px)",
              left: deepDive ? "calc(50% + 2px)" : "2px",
              background: deepDive ? "#39ff14" : "#00f5ff",
            }}
          />
          <span className={cn(
            "relative z-10 flex-1 text-center py-1 text-[11px] font-black transition-colors duration-300 select-none",
            !deepDive ? "text-black" : "text-muted-foreground"
          )}>
            Quick-Win
          </span>
          <span className={cn(
            "relative z-10 flex-1 text-center py-1 text-[11px] font-black transition-colors duration-300 select-none",
            deepDive ? "text-black" : "text-muted-foreground"
          )}>
            Deep Dive
          </span>
        </button>

        {/* XP */}
        <div className="flex items-center gap-1">
          <span className="text-base leading-none">⚡</span>
          <span className="text-lg font-black tabular-nums text-[#39ff14]">{xp}</span>
          <span className="text-xs text-muted-foreground font-medium">XP</span>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet context={{ deepDive, streak, xp }} />
      </main>

      {/* ── Bottom tab bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center">
        <div className="w-full max-w-lg bg-background/95 backdrop-blur-xl border-t border-border safe-area-bottom">
          <div className="flex items-center justify-around" style={{ height: 64 }}>
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-90"
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    className="transition-all duration-200"
                    style={{
                      color: active ? "#00f5ff" : "hsl(var(--muted-foreground))",
                      transform: active ? "scale(1.15)" : "scale(1)",
                      filter: active ? "drop-shadow(0 0 6px #00f5ff88)" : "none",
                    }}
                  />
                  <span
                    className="text-[10px] font-bold transition-colors duration-200"
                    style={{ color: active ? "#00f5ff" : "hsl(var(--muted-foreground))" }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}