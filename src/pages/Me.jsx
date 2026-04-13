import { Bell, Palette, HelpCircle, LogOut, ChevronRight, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MENU = [
  { icon: Bell, label: "Notifications", desc: "Daily mission reminders" },
  { icon: Palette, label: "Appearance", desc: "Dark / Light mode" },
  { icon: HelpCircle, label: "Help", desc: "How missions and streaks work" },
];

export default function Me() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Profile */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
          style={{ borderColor: "rgba(0,245,255,0.4)", background: "rgba(0,245,255,0.08)" }}>
          🧠
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-black">Your Profile</h1>
          <div className="flex gap-2 mt-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,245,255,0.15)", color: "#00f5ff" }}>Level 1</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(57,255,20,0.15)", color: "#39ff14" }}>0 XP</span>
          </div>
        </div>
        <button className="p-2 rounded-xl border bg-secondary">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { emoji: "🔥", value: "0", label: "Streak" },
          { emoji: "🏆", value: "0", label: "Wins" },
          { emoji: "🛡️", value: "3", label: "Freezes" },
        ].map(({ emoji, value, label }) => (
          <div key={label} className="rounded-2xl border bg-card p-3 text-center space-y-0.5">
            <div className="text-xl">{emoji}</div>
            <div className="text-lg font-black">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
        {MENU.map(({ icon: Icon, label, desc }) => (
          <button key={label}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={() => base44.auth.logout()}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-destructive/30 text-destructive text-sm font-bold hover:bg-destructive/5 transition-colors">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}