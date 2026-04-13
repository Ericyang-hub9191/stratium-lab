import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Zap, Flame, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const tabs = [
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
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Streak flame + count */}
          <div className="flex items-center gap-2">
            <span
              className="text-2xl animate-bounce"
              style={{ animationDuration: "1.4s" }}
              role="img"
              aria-label="streak"
            >
              🔥
            </span>
            <div className="leading-none">
              <span className="text-xl font-black" style={{ color: "#00f5ff" }}>
                0
              </span>
              <span className="text-xs text-muted-foreground ml-1 font-medium">
                streak
              </span>
            </div>
          </div>

          {/* Deep Dive toggle pill */}
          <button
            onClick={() => setDeepDive((v) => !v)}
            className={cn(
              "relative flex items-center rounded-full px-1 py-1 text-xs font-semibold transition-all duration-300 border",
              deepDive
                ? "border-[#39ff14] bg-[#39ff14]/10"
                : "border-border bg-secondary"
            )}
            style={{ minWidth: 148 }}
          >
            <span
              className={cn(
                "px-3 py-1 rounded-full transition-all duration-300 text-xs font-bold",
                !deepDive
                  ? "bg-[#00f5ff] text-black shadow"
                  : "text-muted-foreground"
              )}
            >
              Quick-Win
            </span>
            <span
              className={cn(
                "px-3 py-1 rounded-full transition-all duration-300 text-xs font-bold",
                deepDive
                  ? "bg-[#39ff14] text-black shadow"
                  : "text-muted-foreground"
              )}
            >
              Deep Dive
            </span>
          </button>

          {/* XP */}
          <div className="flex items-center gap-1">
            <span className="text-base">⚡</span>
            <span
              className="text-sm font-black"
              style={{ color: "#39ff14" }}
            >
              0
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              XP
            </span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet context={{ deepDive }} />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active =
              path === "/" ? pathname === "/" : pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200",
                  active ? "opacity-100" : "opacity-50 hover:opacity-75"
                )}
              >
                <Icon
                  className="w-5 h-5 transition-transform duration-200"
                  style={
                    active
                      ? { color: "#00f5ff", transform: "scale(1.15)" }
                      : {}
                  }
                  strokeWidth={active ? 2.5 : 1.8}
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
      </nav>
    </div>
  );
}