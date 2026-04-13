import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Zap, Flame, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const TABS = [
  { path: "/",          icon: Home,        label: "Home"     },
  { path: "/missions",  icon: Zap,         label: "Missions" },
  { path: "/streak",    icon: Flame,       label: "Streak"   },
  { path: "/progress",  icon: TrendingUp,  label: "Progress" },
  { path: "/me",        icon: User,        label: "Me"       },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [deepDive, setDeepDive] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp]         = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const [streaks, stats] = await Promise.all([
          base44.entities.Streak.filter({ userId: user.id }),
          base44.entities.UserStats.filter({ userId: user.id }),
        ]);
        setStreak(streaks[0]?.currentStreak ?? 0);
        setXp(stats[0]?.totalXp ?? 0);
      } catch (_) {}
    })();
  }, []);

  const isHighStreak = streak >= 7;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between gap-2">

        {/* Streak flame + count */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[32px] leading-none select-none",
              isHighStreak ? "animate-pulse-glow" : "animate-streak-fire"
            )}
            style={{
              display: "inline-block",
              filter: isHighStreak
                ? "drop-shadow(0 0 10px #ff6b35) drop-shadow(0 0 20px #ff6b35)"
                : "drop-shadow(0 0 4px #ff6b35)",
            }}
          >
            🔥
          </span>
          <span className="text-2xl font-black tabular-nums text-[#00f5ff] leading-none">
            {streak}
          </span>
          <span className="text-xs text-muted-foreground font-medium">streak</span>
        </div>

        {/* Deep Dive toggle pill */}
        <button
          onClick={() => setDeepDive(v => !v)}
          role="switch"
          aria-checked={deepDive}
          className="relative flex items-center rounded-full border transition-colors duration-300 overflow-hidden p-1 min-w-[148px]"
          style={{ borderColor: deepDive ? "#39ff14" : "#00f5ff" }}
        >
          {/* Sliding pill background */}
          <span
            className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
            style={{
              left:       deepDive ? "calc(50% + 2px)" : "4px",
              right:      deepDive ? "4px"             : "calc(50% + 2px)",
              background: deepDive ? "#39ff14"         : "#00f5ff",
            }}
          />
          <span className={cn(
            "relative z-10 flex-1 text-center text-[11px] font-black py-1 select-none transition-colors duration-200",
            !deepDive ? "text-black" : "text-muted-foreground"
          )}>
            Quick-Win
          </span>
          <span className={cn(
            "relative z-10 flex-1 text-center text-[11px] font-black py-1 select-none transition-colors duration-200",
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
        <div className="w-full max-w-lg bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="flex items-stretch h-16">
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all duration-200 active:scale-90"
                  style={{ opacity: active ? 1 : 0.4 }}
                >
                  <Icon
                    style={{
                      width: 22, height: 22,
                      color:     active ? "#00f5ff" : undefined,
                      transform: active ? "scale(1.2)" : "scale(1)",
                      transition: "transform 0.2s, color 0.2s",
                      strokeWidth: active ? 2.5 : 1.8,
                    }}
                  />
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: active ? "#00f5ff" : undefined }}
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