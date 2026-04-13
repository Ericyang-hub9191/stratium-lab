import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Zap, Flame, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between gap-2">

        {/* Streak flame + count */}
        <div className="flex items-center gap-1.5">
          <span className="text-3xl" style={{ display: "inline-block", animation: "bounce 1.4s infinite" }}>
            🔥
          </span>
          <span className="text-2xl font-black tabular-nums" style={{ color: "#00f5ff" }}>0</span>
          <span className="text-xs text-muted-foreground font-medium">streak</span>
        </div>

        {/* Quick-Win / Deep Dive toggle pill */}
        <button
          onClick={() => setDeepDive(v => !v)}
          className="flex items-center rounded-full p-1 border transition-colors duration-300"
          style={{
            borderColor: deepDive ? "#39ff14" : "#00f5ff",
            background: "transparent",
          }}
        >
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300"
            style={!deepDive ? { background: "#00f5ff", color: "#000" } : { color: "var(--muted-foreground)" }}
          >
            Quick-Win
          </span>
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300"
            style={deepDive ? { background: "#39ff14", color: "#000" } : { color: "var(--muted-foreground)" }}
          >
            Deep Dive
          </span>
        </button>

        {/* XP */}
        <div className="flex items-center gap-1">
          <span className="text-base">⚡</span>
          <span className="text-lg font-black tabular-nums" style={{ color: "#39ff14" }}>0</span>
          <span className="text-xs text-muted-foreground font-medium">XP</span>
        </div>

      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet context={{ deepDive }} />
      </main>

      {/* ── Bottom tab bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center">
        <div className="w-full max-w-lg bg-background/90 backdrop-blur-xl border-t border-border">
          <div className="flex items-center justify-around h-16 px-2">
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center gap-0.5 flex-1 py-2 transition-opacity duration-150"
                  style={{ opacity: active ? 1 : 0.45 }}
                >
                  <Icon
                    className="w-5 h-5 transition-transform duration-200"
                    strokeWidth={active ? 2.5 : 1.8}
                    style={active ? { color: "#00f5ff", transform: "scale(1.15)" } : {}}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={active ? { color: "#00f5ff" } : {}}
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