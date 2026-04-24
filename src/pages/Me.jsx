/* ─────────────────────────────────────────────────────────────
   Me — profile and account.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { LogOut, Bell, AlertTriangle, Edit2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { levelFromXp } from "@/lib/progress-utils";

const ALL_TRACKS = ["prompting", "writing", "research", "automation", "python", "data", "rag", "business", "biology", "safety", "psychology", "mlops", "build-your-own"];

export default function Me() {
  const [user, setUser]   = useState(null);
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTracks, setEditingTracks] = useState(false);
  const [draftTracks, setDraftTracks] = useState([]);
  const [savingTracks, setSavingTracks] = useState(false);

  const [notifications, setNotifications] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("stratiumlab_notifications") === "true"
  );

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (cancelled) return;
        setUser(u);
        const [statsArr, streakArr] = await Promise.all([
          base44.entities.UserStats.filter({ userId: u.id }),
          base44.entities.Streak.filter({ userId: u.id }),
        ]);
        if (cancelled) return;
        setStats(statsArr[0] ?? null);
        setStreak(streakArr[0] ?? null);
        setDraftTracks(statsArr[0]?.favoriteTracks ?? []);
      } catch (e) {
        console.error("Me load failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleTrack = (t) => {
    setDraftTracks(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const saveTracks = async () => {
    if (!stats) return;
    setSavingTracks(true);
    try {
      await base44.entities.UserStats.update(stats.id, { favoriteTracks: draftTracks });
      setStats(s => ({ ...s, favoriteTracks: draftTracks }));
      setEditingTracks(false);
    } catch (e) {
      console.error("Save tracks failed:", e);
    } finally {
      setSavingTracks(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const [streaks, statsList, progressList] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.UserStats.filter({ userId: user.id }),
        base44.entities.UserProgress.filter({ userId: user.id }),
      ]);
      await Promise.all([
        ...streaks.map(r => base44.entities.Streak.delete(r.id)),
        ...statsList.map(r => base44.entities.UserStats.delete(r.id)),
        ...progressList.map(r => base44.entities.UserProgress.delete(r.id)),
      ]);
      await base44.auth.deleteMe();
      setTimeout(() => base44.auth.logout(), 1500);
    } catch (e) {
      console.error("Delete failed:", e);
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" /></div>;
  }

  const { level } = levelFromXp(stats?.totalXp ?? 0);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-7">

      <div className="space-y-1">
        <div className="ui-eyebrow">Account</div>
        <h1 className="text-2xl md:text-3xl ui-heading">{user?.full_name ?? "You"}</h1>
        {user?.email && <p className="text-sm text-text-secondary">{user.email}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Level" value={`L${level}`} />
        <Stat label="Streak" value={`${streak?.currentStreak ?? 0}d`} />
        <Stat label="Total XP" value={(stats?.totalXp ?? 0).toLocaleString()} />
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm ui-heading">Tracks you care about</h3>
          {!editingTracks && (
            <button onClick={() => setEditingTracks(true)} className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5">
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
        {editingTracks ? (
          <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {ALL_TRACKS.map(t => {
                const on = draftTracks.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTrack(t)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors capitalize ${
                      on
                        ? "border-accent bg-[hsla(var(--accent),0.12)] text-text-primary"
                        : "border-border text-text-secondary hover:border-border-strong"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setEditingTracks(false); setDraftTracks(stats?.favoriteTracks ?? []); }} className="btn btn-quiet text-sm">Cancel</button>
              <button onClick={saveTracks} disabled={savingTracks} className="btn btn-primary">{savingTracks ? "Saving…" : "Save"}</button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            {(stats?.favoriteTracks ?? []).length === 0 ? (
              <p className="text-sm text-text-secondary">No tracks selected. Edit to pick the ones you want recommendations from.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stats.favoriteTracks.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-xs border border-border text-text-secondary capitalize">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm ui-heading mb-3">Reminders</h3>
        <div className="rounded-lg border border-border bg-surface-1 p-4 flex items-center gap-3">
          <Bell className="w-4 h-4 text-text-secondary shrink-0" />
          <div className="flex-1">
            <div className="text-sm text-text-primary">Daily reminder</div>
            <div className="text-xs text-text-secondary mt-0.5">A 9am nudge to keep your streak.</div>
          </div>
          <Switch
            checked={notifications}
            onCheckedChange={(v) => {
              setNotifications(v);
              localStorage.setItem("stratiumlab_notifications", String(v));
            }}
          />
        </div>
      </section>

      <button onClick={() => base44.auth.logout()} className="btn btn-ghost w-full">
        <LogOut className="w-4 h-4" /> Sign out
      </button>

      <section className="pt-4 border-t border-border">
        <h3 className="text-xs font-medium text-danger mb-2 uppercase tracking-wider">Danger zone</h3>
        <p className="text-xs text-text-secondary mb-3">Permanently delete your account and all data. Cannot be undone.</p>
        <button
          onClick={() => setShowDelete(true)}
          className="btn btn-ghost border-danger/40 text-danger hover:bg-[hsla(0,72%,62%,0.06)] hover:border-danger w-full"
        >
          <AlertTriangle className="w-4 h-4" /> Delete account
        </button>
      </section>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-danger/40 bg-bg p-5 space-y-4">
            <h2 className="text-base font-medium text-text-primary">Delete account?</h2>
            <p className="text-sm text-text-secondary">All your progress, streak, XP, and saved reflections will be permanently removed. This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowDelete(false)} disabled={deleting} className="btn btn-ghost">Cancel</button>
              <button onClick={deleteAccount} disabled={deleting} className="btn" style={{ background: "hsl(var(--danger))", color: "white" }}>
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-3 text-center">
      <div className="text-xl font-medium text-text-primary tabular-nums">{value}</div>
      <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
    </div>
  );
}