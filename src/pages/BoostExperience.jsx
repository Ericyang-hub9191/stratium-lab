/* ─────────────────────────────────────────────────────────────
   BoostExperience — standalone 3-5 min practical.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Check, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateStreak, updateUserStatsForBoost } from "@/lib/progress-utils";
import Block, { allRequiredChecksPassed } from "@/components/blocks";

export default function BoostExperience() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [boost, setBoost]           = useState(null);
  const [progress, setProgress]     = useState(null);
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [boostResults, currentUser] = await Promise.all([
          base44.entities.Boost.filter({ id }),
          base44.auth.me().catch(() => null),
        ]);
        if (cancelled) return;
        const rec = boostResults[0] ?? null;
        setBoost(rec);
        setUser(currentUser);

        if (currentUser && rec) {
          const existing = await base44.entities.UserProgress.filter({
            userId: currentUser.id,
            contentId: rec.id,
            contentType: "boost",
          });
          if (existing[0]) {
            if (!cancelled) setProgress(existing[0]);
          } else {
            const created = await base44.entities.UserProgress.create({
              userId: currentUser.id,
              contentId: rec.id,
              contentType: "boost",
              status: "in-progress",
              checkAnswers: {},
              practiceEntries: {},
              writeEntries: {},
              startedAt: new Date().toISOString(),
              xpAwarded: 0,
            });
            if (!cancelled) setProgress(created);
          }
        }
      } catch (e) {
        console.error("Failed to load boost:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const persistTimer = useRef(null);
  const handleProgressUpdate = (partial) => {
    setProgress(prev => {
      const next = { ...prev, ...partial };
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        if (next.id) base44.entities.UserProgress.update(next.id, partial).catch(() => {});
      }, 600);
      return next;
    });
  };

  const canComplete = useMemo(() => {
    if (!boost || !progress) return false;
    if (progress.status === "completed") return false;
    return allRequiredChecksPassed(boost.blocks ?? [], progress);
  }, [boost, progress]);

  const isCompleted = progress?.status === "completed";

  const handleComplete = async () => {
    if (!canComplete || !user || !boost || completing) return;
    setCompleting(true);
    const timeSpent = Math.round((Date.now() - startedAtRef.current) / 1000);
    try {
      await Promise.all([
        base44.entities.UserProgress.update(progress.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
          xpAwarded: boost.xpReward ?? 40,
          timeSpentSeconds: (progress.timeSpentSeconds ?? 0) + timeSpent,
        }),
        updateStreak(user.id),
        updateUserStatsForBoost(user.id, boost.xpReward ?? 40),
      ]);
      window.dispatchEvent(new CustomEvent("progress-updated"));
      setProgress(p => ({ ...p, status: "completed", completedAt: new Date().toISOString(), xpAwarded: boost.xpReward ?? 40 }));
    } catch (e) {
      console.error("Complete failed:", e);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  if (!boost) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-bg">
        <p className="text-text-secondary">Boost not found.</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">Go back</button>
      </div>
    );
  }

  const requiredChecks = (boost.blocks ?? []).filter(b => b.type === "check" && b.required !== false);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost !py-1.5 !px-2.5" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-accent flex items-center gap-1">
              <Zap className="w-3 h-3" /> Boost · {boost.category}
            </div>
            <div className="text-sm font-medium text-text-primary truncate">{boost.title}</div>
          </div>
          {boost.estimatedMinutes && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-text-secondary">
              <Clock className="w-3.5 h-3.5" />{boost.estimatedMinutes} min
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 reading-surface py-8 md:py-12 px-4 md:px-8 animate-fade-in">
        <article className="max-w-2xl mx-auto space-y-6 pb-28">
          <header className="space-y-3 pb-4 mb-2 border-b" style={{ borderColor: "hsl(var(--reading-border))" }}>
            <div className="eyebrow">Quick Boost · {boost.category}</div>
            <h1 className="!mt-0">{boost.title}</h1>
            {boost.subtitle && (
              <p className="text-[1.1em] muted !mt-1" style={{ lineHeight: 1.5 }}>{boost.subtitle}</p>
            )}
          </header>

          {(boost.blocks ?? []).map(block => (
            <Block
              key={block.id}
              block={block}
              progress={progress}
              onProgress={handleProgressUpdate}
            />
          ))}
        </article>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border backdrop-blur-xl" style={{ background: "hsla(var(--bg), 0.92)" }}>
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3.5 flex items-center gap-4">
          <div className="flex-1 text-xs text-text-secondary">
            {isCompleted
              ? <span className="flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Done · +{progress?.xpAwarded ?? boost.xpReward} XP</span>
              : requiredChecks.length > 0 && !canComplete
                ? <span>Answer the checkpoint to finish.</span>
                : canComplete
                  ? <span className="text-text-primary">Ready.</span>
                  : <span>When you've tried it, mark this done.</span>
            }
          </div>
          <button onClick={handleComplete} disabled={!canComplete || completing || isCompleted} className="btn btn-primary">
            {isCompleted ? <><Check className="w-4 h-4" /> Done</>
              : completing ? "Saving…"
              : `Mark done · +${boost.xpReward ?? 40} XP`}
          </button>
        </div>
      </div>
    </div>
  );
}