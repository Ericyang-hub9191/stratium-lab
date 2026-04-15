import { useState } from "react";
import { X, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { base44 } from "@/api/base44Client";
import { updateStreak, updateUserStats } from "@/lib/progress-utils";

function fireWinConfetti() {
  const opts = (origin) => ({
    particleCount: 70, spread: 70, origin,
    colors: ["#39ff14", "#00f5ff", "#ffffff", "#fb923c"],
  });
  confetti(opts({ y: 0.55, x: 0.5 }));
  setTimeout(() => confetti(opts({ y: 0.5, x: 0.15 })), 180);
  setTimeout(() => confetti(opts({ y: 0.5, x: 0.85 })), 360);
}


export default function ImpactLoggerModal({ open, onClose, mission, onSuccess }) {
  const [note,    setNote]    = useState("");
  const [logging, setLogging] = useState(false);
  const [done,    setDone]    = useState(false);

  if (!open) return null;

  const xpEarned = mission?.xpReward ?? 50;

  const handleLog = async () => {
    setLogging(true);
    fireWinConfetti();
    window.dispatchEvent(new CustomEvent('win-logged-optimistic', { detail: { xpDelta: xpEarned } }));
    setDone(true);

    (async () => {
      try {
        const user = await base44.auth.me();
        await Promise.all([
          base44.entities.WinLog.create({
            missionId: mission?.id ?? "unknown",
            userId:    user.id,
            note:      note.trim() || undefined,
            appliedAt: new Date().toISOString(),
            xpEarned,
            category:  mission?.category,
          }),

          updateStreak(user.id),
          updateUserStats(user.id, xpEarned),
        ]);
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('win-logged'));
    })();

    setLogging(false);
    setTimeout(() => {
      setDone(false);
      onClose();
      onSuccess?.();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-3xl border-t border-border pb-8"
        style={{ background: "hsl(var(--background))", boxShadow: "0 -20px 60px rgba(0,0,0,0.4)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 px-6 text-center">
            <div className="text-6xl animate-bounce">🏆</div>
            <h2 className="text-2xl font-black text-[#39ff14]">Impact Logged!</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-black text-[#00f5ff]">+{xpEarned} XP</span> added · Streak protected 🔥
            </p>
          </div>
        ) : (
          <div className="px-5 pt-3 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Log Your Win</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Instant XP + streak protection</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl border bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}
            >
              <Zap className="w-4 h-4 shrink-0 text-[#00f5ff]" />
              <span className="text-sm font-bold truncate">{mission?.title}</span>
              <span className="ml-auto text-xs font-black shrink-0 text-[#39ff14]">+{xpEarned} XP</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold">
                Quick Note <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                rows={2} value={note} onChange={e => setNote(e.target.value)}
                placeholder="What worked? What would you do differently?"
                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm resize-none outline-none border border-transparent focus:border-[#00f5ff] transition-colors placeholder:text-muted-foreground/50"
                style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
              />
            </div>

            <button
              onClick={handleLog}
              disabled={logging}
              className="w-full py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-70"
              style={{
                background: "linear-gradient(90deg, #39ff14, #00f5ff)",
                boxShadow:  "0 0 28px rgba(57,255,20,0.5)",
              }}
            >
              {logging ? "Logging…" : "🏆 I Applied It — Claim XP"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}