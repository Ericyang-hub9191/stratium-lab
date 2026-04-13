import { Link, useLocation } from "react-router-dom";
import { Home, Zap, Flame, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/missions", icon: Zap, label: "Missions" },
  { path: "/streak", icon: Flame, label: "Streak" },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
  { path: "/me", icon: User, label: "Me" },
];

export default function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}