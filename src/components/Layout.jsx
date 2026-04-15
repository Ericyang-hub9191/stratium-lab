import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Zap, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const TABS = [
  { path: "/",         icon: Home,       label: "Home"     },
  { path: "/missions", icon: Zap,        label: "Missions" },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
  { path: "/me",       icon: User,       label: "Me"       },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Sync dark mode with system preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark) => document.documentElement.classList.toggle('dark', dark);
    apply(mq.matches);
    mq.addEventListener('change', e => apply(e.matches));
    return () => mq.removeEventListener('change', e => apply(e.matches));
  }, []);

  const [deepDive, setDeepDive] = useState(false);
  const [streak,   setStreak]   = useState(0);
  const [xp,       setXp]       = useState(0);
  const [gems,     setGems]     = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      const [streaks, stats] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.UserStats.filter({ userId: user.id }),
      ]);
      setStreak(streaks[0]?.currentStreak ?? 0);
      setXp(stats[0]?.totalXp ?? 0);
      setGems(stats[0]?.gems ?? 10);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchStats(); }, [pathname, fetchStats]);

  useEffect(() => {
    const handleOptimistic = (e) => {
      const delta = e.detail?.xpDelta ?? 0;
      setXp(prev => prev + delta);
      setStreak(prev => prev + 1);
    };
    window.addEventListener('win-logged-optimistic', handleOptimistic);
    window.addEventListener('win-logged', fetchStats);
    return () => {
      window.removeEventListener('win-logged-optimistic', handleOptimistic);
      window.removeEventListener('win-logged', fetchStats);
    };
  }, [fetchStats]);

  const isHighStreak = streak >= 7;

  // ── Shared header content ──────────────────────────────────────────
  const HeaderContent = () => (
    <>
      {/* Streak flame — tappable */}
      <button
        onClick={() => pathname !== "/streak" && navigate("/streak")}
        className="flex items-center gap-2 active:scale-95 transition-transform"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <span
          className={cn("text-[32px] leading-none select-none", isHighStreak ? "animate-pulse-glow" : "animate-streak-fire")}
          style={{
            display: "inline-block",
            filter: isHighStreak
              ? "drop-shadow(0 0 10px #ff6b35) drop-shadow(0 0 20px #ff6b35)"
              : "drop-shadow(0 0 4px #ff6b35)",
          }}
        >🔥</span>
        <span className="text-2xl font-black tabular-nums text-[#00f5ff] leading-none">{streak}</span>
        <span className="text-xs text-muted-foreground font-medium">streak</span>
      </button>

      {/* Deep Dive toggle */}
      <button
        onClick={() => setDeepDive(v => !v)}
        role="switch"
        aria-checked={deepDive}
        className="relative flex items-center rounded-full border transition-colors duration-300 overflow-hidden p-1 min-w-[148px]"
        style={{ borderColor: deepDive ? "#39ff14" : "#00f5ff" }}
      >
        <span
          className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
          style={{
            left:       deepDive ? "calc(50% + 2px)" : "4px",
            right:      deepDive ? "4px"             : "calc(50% + 2px)",
            background: deepDive ? "#39ff14"         : "#00f5ff",
          }}
        />
        <span className={cn("relative z-10 flex-1 text-center text-[11px] font-black py-1 select-none transition-colors duration-200", !deepDive ? "text-black" : "text-muted-foreground")}>
          Quick Boost
        </span>
        <span className={cn("relative z-10 flex-1 text-center text-[11px] font-black py-1 select-none transition-colors duration-200", deepDive ? "text-black" : "text-muted-foreground")}>
          Deep Dive
        </span>
      </button>

      {/* Gems + XP */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-base leading-none">💎</span>
          <span className="text-sm font-black tabular-nums" style={{ color: "#a78bfa" }}>{gems}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-base leading-none">⚡</span>
          <span className="text-lg font-black tabular-nums text-[#39ff14]">{xp}</span>
          <span className="text-xs text-muted-foreground font-medium">XP</span>
        </div>
      </div>
    </>
  );

  // ── Page transition wrapper ────────────────────────────────────────
  const PageContent = ({ mobilePadding }) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
      >
        <Outlet context={{ deepDive, streak, xp }} />
      </motion.div>
    </AnimatePresence>
  );

  // ══════════════════════════════════════════════════════════════════
  // MOBILE layout  (< md)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">

      {/* ─── DESKTOP LAYOUT (md+) ─────────────────────────────────── */}
      <div className="hidden md:flex min-h-screen">

        {/* Left sidebar */}
        <aside
          className="w-56 shrink-0 flex flex-col sticky top-0 h-screen border-r border-border bg-background/95 backdrop-blur-xl z-40"
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          {/* Brand */}
          <div className="px-5 py-6 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-lg font-black tracking-tight text-[#00f5ff]">Synthetica</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">AI habit formation</p>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                    active
                      ? "text-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  style={active ? { background: "linear-gradient(90deg, #00f5ff, #39ff14)", color: "#000" } : {}}
                >
                  <Icon
                    style={{
                      width: 18, height: 18,
                      color: active ? "#000" : undefined,
                      strokeWidth: active ? 2.5 : 1.8,
                    }}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Streak stat in sidebar footer — tappable */}
          <div className="px-4 py-5 border-t border-border space-y-3">
            <button
              onClick={() => pathname !== "/streak" && navigate("/streak")}
              className="flex items-center gap-2 active:scale-95 transition-transform w-full text-left"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <span
                className={cn("text-2xl leading-none select-none", isHighStreak ? "animate-streak-fire" : "")}
                style={{ filter: "drop-shadow(0 0 6px #ff6b35)" }}
              >🔥</span>
              <div>
                <div className="text-xl font-black tabular-nums text-[#00f5ff]">{streak}</div>
                <div className="text-[10px] text-muted-foreground">day streak</div>
              </div>
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm">💎</span>
                <span className="text-sm font-black tabular-nums" style={{ color: "#a78bfa" }}>{gems}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm">⚡</span>
                <span className="text-sm font-black tabular-nums text-[#39ff14]">{xp}</span>
                <span className="text-xs text-muted-foreground">XP</span>
              </div>
            </div>
          </div>

        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop header */}
          <header
            className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between gap-4"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            <HeaderContent />
          </header>

          {/* Desktop page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <PageContent />
            </div>
          </main>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT (< md) ─────────────────────────────────── */}
      <div className="flex md:hidden flex-col max-w-lg mx-auto min-h-screen">

        {/* Mobile header */}
        <header
          className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 flex items-center justify-between gap-2"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 14px)',
            paddingBottom: '12px',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          <HeaderContent />
        </header>

        {/* Mobile page content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <PageContent />
        </main>

        {/* Mobile bottom tab bar */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50 flex justify-center"
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <div
            className="w-full max-w-lg bg-background/95 backdrop-blur-xl border-t border-border"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
          >
            <div className="flex items-stretch h-14">
              {TABS.map(({ path, icon: Icon, label }) => {
                const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 active:scale-90 transition-transform duration-150"
                    style={{ opacity: active ? 1 : 0.4, WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Icon
                      style={{
                        width: 22, height: 22,
                        color: active ? "#00f5ff" : undefined,
                        transform: active ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.18s, color 0.18s",
                        strokeWidth: active ? 2.5 : 1.8,
                      }}
                    />
                    <span className="text-[10px] font-bold" style={{ color: active ? "#00f5ff" : undefined }}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

    </div>
  );
}