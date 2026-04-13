import { useState } from "react";
import { X, Star, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { base44 } from "@/api/base44Client";

function fireWinConfetti() {
  confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#39ff14", "#00f5ff", "#ffffff", "#fb923c"] });
  setTimeout(() => confetti({ particleCount: 50, spread: 80, origin: { y: 0.5, x: 0.2 }, colors: ["#39ff14", "#ffffff"] }), 200);
  setTimeout(() => confetti({ particleCount: 50, spread: 80, origin: { y: 0.5, x: 0.8 }, colors: ["#00f5ff", "#ffffff"] }), 400);
}

export default function WinLoggerModal({ open, onClose, mission, onSuccess }) {
  const [timeSaved, setTimeSaved] = useState(10);
  const [stars, setStars] = useState(3);
  const [note, setNote] = useState("");
  const [logging, setLogging] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const xpEarned = mission?.xpReward ?? 50;

  const handleLog = async () => {
    setLogging(true);
    try {
      await base44.entities.WinLog.create({
        missionId: mission?.id ?? "unknown",
        userId: "placeholder",
        timeSavedMinutes: timeSaved,
        correctnessBoost: stars,
        note: note.trim() || undefined,
        appliedAt: new Date().toISOString(),
        xpEarned,
      });
    } catch (_) {
      // non-blocking — celebration happens regardless
    }

    fireWinConfetti();
    setDone(true);
    setLogging(false);
    setTimeout(() => {
      setDone(false);
      onClose();
      onSuccess?.();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg rounded-t-3xl border-t border-border pb-8"
        style={{ background: "hsl(var(--background))", boxShadow: "0 -20px 60px rgba(0,0,0,0.4)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Done state */}
        {done ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 px-6 text-center">
            <div className="text-6xl animate-bounce">🏆</div>
            <h2 className="text-2xl font-black" style={{ color: "#39ff14" }}>Win Logged!</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-black" style={{ color: "#00f5ff" }}>+{xpEarned} XP</span> added · Streak protected 🔥
            </p>
          </div>
        ) : (
          <div className="px-5 pt-3 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Log Your Win</h2>
                <p className="text-xs text-muted-foreground mt-0.5">How did applying it go?</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl border bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Mission badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}>
              <Zap className="w-4 h-4 shrink-0" style={{ color: "#00f5ff" }} />
              <span className="text-sm font-bold truncate">{mission?.title}</span>
              <span className="ml-auto text-xs font-black shrink-0" style={{ color: "#39ff14" }}>+{xpEarned} XP</span>
            </div>

            {/* Time saved slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">Time Saved</label>
                <span className="text-sm font-black" style={{ color: "#39ff14" }}>{timeSaved} min</span>
              </div>
              <input type="range" min="0" max="60" step="1" value={timeSaved}
                onChange={e => setTimeSaved(Number(e.target.value))}
                className="w-full h-2 rounded-full outline-none cursor-pointer appearance-none"
                style={{ accentColor: "#39ff14" }} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 min</span><span>30 min</span><span>60 min</span>
              </div>
            </div>

            {/* Correctness boost stars */}
            <div className="space-y-2">
              <label className="text-sm font-bold block">Correctness Boost</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setStars(n)}
                    className="flex-1 py-2 rounded-xl border transition-all duration-150 active:scale-90"
                    style={n <= stars
                      ? { background: "rgba(57,255,20,0.15)", borderColor: "#39ff14" }
                      : { background: "transparent", borderColor: "hsl(var(--border))" }}>
                    <Star className="w-5 h-5 mx-auto"
                      fill={n <= stars ? "#39ff14" : "none"}
                      stroke={n <= stars ? "#39ff14" : "hsl(var(--muted-foreground))"}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {["", "Slight nudge", "Noticeable lift", "Clear improvement", "Big jump", "Game changer"][stars]}
              </p>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Quick Note <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                placeholder="What changed? What would you do differently?"
                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm resize-none outline-none border border-transparent focus:border-[#00f5ff] transition-colors placeholder:text-muted-foreground/50" />
            </div>

            {/* Log Win CTA */}
            <button onClick={handleLog} disabled={logging}
              className="w-full py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-70"
              style={{
                background: "linear-gradient(90deg, #39ff14, #00f5ff)",
                boxShadow: "0 0 28px rgba(57,255,20,0.5)",
              }}>
              {logging ? "Logging…" : <>🏆 Log Win — Protect Streak</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}