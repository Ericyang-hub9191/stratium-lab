/* ─────────────────────────────────────────────────────────────
   Layout — app chrome, mobile + desktop.
   ───────────────────────────────────────────────────────────── */

import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, BarChart3, User, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { levelFromXp } from "@/lib/progress-utils";

const TABS = [
  { path: "/",         icon: Home,      label: "Home" },
  { path: "/library",  icon: BookOpen,  label: "Library" },
  { path: "/signals",  icon: Radio,     label: "Signals" },
  { path: "/progress", icon: BarChart3, label: "Progress" },
  { path: "/me",       icon: User,      label: "You" },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      const [streaks, stats] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.UserStats.filter({ userId: user.id }),
      ]);
      setStreak(streaks[0]?.currentStreak ?? 0);
      setXp(stats[0]?.totalXp ?? 0);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchStats(); }, [pathname, fetchStats]);

  useEffect(() => {
    const onUpdate = () => { setTimeout(fetchStats, 200); };
    window.addEventListener("progress-updated", onUpdate);
    return () => window.removeEventListener("progress-updated", onUpdate);
  }, [fetchStats]);

  const { level } = levelFromXp(xp);

  const Wordmark = ({ size = "md" }) => (
    <Link to="/" className="flex items-center gap-2" style={{ WebkitTapHighlightColor: "transparent" }}>
      <span
        className="inline-block rounded"
        style={{
          width: size === "lg" ? 18 : 14,
          height: size === "lg" ? 18 : 14,
          background: "hsl(var(--accent))",
        }}
      />
      <span
        className={cn("font-medium tracking-tight text-text-primary", size === "lg" ? "text-lg" : "text-sm")}
        style={{ letterSpacing: "-0.02em" }}
      >
        Synthetica
      </span>
    </Link>
  );

  const StreakChip = () => (
    <button
      onClick={() => pathname !== "/streak" && navigate("/streak")}
      className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <span style={{ color: streak > 0 ? "hsl(var(--streak))" : "hsl(var(--text-muted))" }}>●</span>
      <span className="font-medium tabular-nums text-text-primary">{streak}</span>
      <span>day{streak === 1 ? "" : "s"}</span>
    </button>
  );

  const LevelChip = () => (
    <Link
      to="/progress"
      className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
    >
      <span className="font-medium text-text-primary tabular-nums">L{level}</span>
      <span className="hidden sm:inline">·</span>
      <span className="hidden sm:inline tabular-nums">{xp.toLocaleString()} XP</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg">

      {/* ═══ DESKTOP (md+) ═══════════════════════════════ */}
      <div className="hidden md:flex min-h-screen">
        <aside className="w-60 shrink-0 flex flex-col sticky top-0 h-screen border-r border-border bg-bg z-30">
          <div className="px-5 py-5 border-b border-border">
            <Wordmark size="lg" />
          </div>
          <nav className="flex-1 px-2.5 py-4 space-y-0.5">
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150",
                    active
                      ? "bg-surface-2 text-text-primary font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-1"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border px-3 py-3 flex items-center justify-between">
            <StreakChip />
            <LevelChip />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ═══ MOBILE (< md) ═══════════════════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 h-12">
            <Wordmark />
            <div className="flex items-center gap-3">
              <StreakChip />
              <span className="text-text-muted">·</span>
              <LevelChip />
            </div>
          </div>
        </header>
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg/95 backdrop-blur-xl border-t border-border">
          <div className="grid grid-cols-5">
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2.5 transition-colors",
                    active ? "text-text-primary" : "text-text-muted"
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.75} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

    </div>
  );
}