import { Bell, Palette, HelpCircle, LogOut, ChevronRight, Settings, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";

const MENU = [
  { icon: Bell, label: "Notifications", desc: "Daily mission reminders" },
  { icon: Palette, label: "Appearance", desc: "Dark / Light mode" },
  { icon: HelpCircle, label: "Help", desc: "How missions and streaks work" },
];

export default function Me() {
  const [resetting, setResetting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const user = await base44.auth.me();
      const [streaks, stats, wins, progress] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.UserStats.filter({ userId: user.id }),
        base44.entities.WinLog.filter({ userId: user.id }),
        base44.entities.UserProgress.filter({ userId: user.id }),
      ]);
      await Promise.all([
        ...streaks.map(r => base44.entities.Streak.delete(r.id)),
        ...stats.map(r => base44.entities.UserStats.delete(r.id)),
        ...wins.map(r => base44.entities.WinLog.delete(r.id)),
        ...progress.map(r => base44.entities.UserProgress.delete(r.id)),
      ]);
      await base44.auth.deleteMe();
      setDeleted(true);
      setTimeout(() => base44.auth.logout(), 2500);
    } catch (e) {
      setDeleting(false);
      // Show inline error
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all progress? This deletes your XP, streak, and win logs. Cannot be undone.")) return;
    setResetting(true);
    try {
      const user = await base44.auth.me();
      const [streaks, stats, wins, progress] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.UserStats.filter({ userId: user.id }),
        base44.entities.WinLog.filter({ userId: user.id }),
        base44.entities.UserProgress.filter({ userId: user.id }),
      ]);
      await Promise.all([
        ...streaks.map(r => base44.entities.Streak.delete(r.id)),
        ...stats.map(r => base44.entities.UserStats.delete(r.id)),
        ...wins.map(r => base44.entities.WinLog.delete(r.id)),
        ...progress.map(r => base44.entities.UserProgress.delete(r.id)),
      ]);
      window.dispatchEvent(new CustomEvent('win-logged'));
    } catch (_) {}
    setResetting(false);
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
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
          { emoji: "🏆", value: "0", label: "Impact" },
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

      {/* Reset progress (testing) */}
      <button
        onClick={handleReset}
        disabled={resetting}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-orange-500/30 text-orange-400 text-sm font-bold transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" /> {resetting ? "Resetting…" : "Reset Progress (Testing)"}
      </button>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-red-500/30 p-4 space-y-3"
        style={{ background: "rgba(239,68,68,0.04)" }}>
        <p className="text-xs font-black uppercase tracking-wider text-red-400">Danger Zone</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permanently deletes your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/40 text-red-400 text-sm font-black transition-all active:scale-95"
          style={{ background: "rgba(239,68,68,0.08)" }}
        >
          <AlertTriangle className="w-4 h-4" /> Delete My Account
        </button>
      </div>

      {/* Sign out */}
      <button onClick={() => base44.auth.logout()}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-destructive/30 text-destructive text-sm font-bold transition-colors">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteDialog(false)} />
          <div className="relative w-full max-w-sm rounded-3xl border border-red-500/40 overflow-hidden"
            style={{ background: 'hsl(var(--background))', boxShadow: '0 0 60px rgba(239,68,68,0.2)' }}>

            {/* Success state */}
            {deleted ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 space-y-4 text-center">
                <CheckCircle className="w-12 h-12 text-[#39ff14]" />
                <h2 className="text-xl font-black">Account Deleted</h2>
                <p className="text-sm text-muted-foreground">Your data has been permanently removed. Signing you out…</p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(239,68,68,0.15)" }}>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black">Delete Account</h2>
                    <p className="text-xs text-muted-foreground">This cannot be undone</p>
                  </div>
                </div>

                {/* What gets deleted */}
                <div className="rounded-2xl border border-red-500/20 p-4 space-y-2"
                  style={{ background: "rgba(239,68,68,0.06)" }}>
                  <p className="text-xs font-black text-red-400 uppercase tracking-wide">Permanently deleted:</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2"><span className="text-red-400">✕</span> All streak history and freeze power-ups</li>
                    <li className="flex items-center gap-2"><span className="text-red-400">✕</span> All win logs and XP earned</li>
                    <li className="flex items-center gap-2"><span className="text-red-400">✕</span> All badges, stats, and mission progress</li>
                    <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Your user account and profile</li>
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  This will permanently delete your account, all streaks, win logs, stats, and progress. This action cannot be undone.
                </p>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={deleting}
                    className="py-3.5 rounded-2xl border bg-secondary text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.35)' }}
                  >
                    {deleting ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</>
                    ) : "Delete Forever"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}