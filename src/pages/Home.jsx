import { useOutletContext, useNavigate } from "react-router-dom";
import { Zap, Clock, ChevronRight, TrendingUp, Radio, Map } from "lucide-react";
import { getTodaySignal } from "@/lib/signals-data";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { base44 } from "@/api/base44Client";
import OnboardingModal from "@/components/OnboardingModal";



const CATEGORY_COLORS = {
  prompting:  "#00f5ff",
  writing:    "#39ff14",
  research:   "#a78bfa",
  python:     "#fb923c",
  automation: "#f472b6",
};

export default function Home() {
  const { deepDive } = useOutletContext() || {};
  const navigate     = useNavigate();

  const [streak,      setStreak]      = useState(0);
  const [xp,          setXp]          = useState(0);
  const [mission,     setMission]     = useState(null);
  const [recentWins,  setRecentWins]  = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({ missions: 0, weeklyXp: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("synthetica_onboarded"));

  const milestoneRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const [pullDist, setPullDist] = useState(0);
  const todaySignal = getTodaySignal();

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [streaks, stats, missions, wins] = await Promise.all([
        base44.entities.Streak.filter({ userId: user.id }),
        base44.entities.UserStats.filter({ userId: user.id }),
        base44.entities.Mission.filter({ type: deepDive ? "deep-dive" : "quick-boost" }, "-created_date", 1),
        base44.entities.WinLog.filter({ userId: user.id }, "-created_date", 10),
      ]);
      const currentStreak = streaks[0]?.currentStreak ?? 0;
      setStreak(currentStreak);
      setXp(stats[0]?.totalXp ?? 0);
      if (missions[0]) setMission(missions[0]);
      setRecentWins(wins.slice(0, 4));
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const weekWins = wins.filter(w => w.created_date >= oneWeekAgo);
      const weeklyXp = weekWins.reduce((s, w) => s + (w.xpEarned ?? 0), 0);
      setWeeklyStats({ missions: weekWins.length, weeklyXp });
      if (!milestoneRef.current && currentStreak > 0 && currentStreak % 7 === 0) {
        milestoneRef.current = true;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#00f5ff", "#39ff14", "#ffffff", "#fb923c"] });
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const reload = async () => {
    setRefreshing(true);
    await loadData();
    setLoading(false);
    setRefreshing(false);
  };

  const weeklyGoal = 7;
  const weekPct    = Math.min(Math.round((weeklyStats.missions / weeklyGoal) * 100), 100);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    const dist = e.touches[0].clientY - touchStartY.current;
    if (dist > 0 && window.scrollY === 0) setPullDist(Math.min(dist, 80));
  };
  const handleTouchEnd = () => {
    if (pullDist > 60) reload();
    setPullDist(0);
  };

  const handleDismissOnboarding = () => {
    localStorage.setItem("synthetica_onboarded", "true");
    setShowOnboarding(false);
  };

  return (
    <>
    {showOnboarding && <OnboardingModal onDismiss={handleDismissOnboarding} />}
    <div
      className="px-4 py-5 space-y-5"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-x pan-y' }}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDist > 10 || refreshing) && (
        <div className="flex justify-center" style={{ marginTop: -16, marginBottom: -8, opacity: refreshing ? 1 : pullDist / 80 }}>
          <div className={`w-6 h-6 border-2 border-[#00f5ff]/40 border-t-[#00f5ff] rounded-full ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      {/* ── Streak hero (tappable → /streak) ── */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => navigate("/streak")}
          className="flex items-center gap-3 active:scale-95 transition-transform"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span
            className="text-5xl leading-none"
            style={{ filter: "drop-shadow(0 0 12px #ff6b35)", animation: "bounce 1.4s infinite" }}
          >
            🔥
          </span>
          <div className="text-left">
            <div className="text-3xl font-black leading-none text-[#00f5ff]">{streak} days</div>
            <div className="text-xs text-muted-foreground font-semibold mt-0.5">Current streak — keep it alive!</div>
          </div>
        </button>
        <div className="text-right">
          <div className="text-2xl font-black text-[#39ff14]">{xp}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Total XP</div>
        </div>
      </div>

      {/* ── Today's Featured card ── */}
      {loading ? (
        <div className="rounded-3xl border bg-card p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-border border-t-[#00f5ff] rounded-full animate-spin" />
        </div>
      ) : mission ? (
        <div
          className="rounded-3xl border p-5 space-y-4 relative overflow-hidden"
          style={{
            borderColor: deepDive ? "rgba(57,255,20,0.35)" : "rgba(0,245,255,0.35)",
            background: deepDive
              ? "linear-gradient(135deg, rgba(57,255,20,0.07) 0%, rgba(0,245,255,0.04) 100%)"
              : "linear-gradient(135deg, rgba(0,245,255,0.07) 0%, rgba(57,255,20,0.04) 100%)",
            boxShadow: deepDive
              ? "0 0 40px rgba(57,255,20,0.08)"
              : "0 0 40px rgba(0,245,255,0.08)",
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: deepDive
              ? "radial-gradient(circle, rgba(57,255,20,0.15), transparent 70%)"
              : "radial-gradient(circle, rgba(0,245,255,0.15), transparent 70%)" }}
          />

          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full text-black"
              style={{ background: deepDive ? "#39ff14" : "#00f5ff" }}
            >
              {deepDive ? "🗺️ Learning Journey" : <><Zap className="w-3 h-3" />Quick Boost</>}
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {deepDive && mission.lessonNumber && mission.totalLessons ? (
                <span className="font-bold" style={{ color: "#39ff14" }}>
                  Lesson {mission.lessonNumber} of {mission.totalLessons}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {mission.durationMinutes ?? 4} min
                </span>
              )}
              <span className="font-bold text-[#39ff14]">+{mission.xpReward ?? 75} XP</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              {deepDive ? "Featured Journey" : "Today's Boost"}
            </p>
            {deepDive && mission.unitTitle && (
              <p className="text-[10px] text-muted-foreground mb-1 font-semibold" style={{ color: "#39ff14" }}>
                {mission.unitTitle}
              </p>
            )}
            <h2 className="text-2xl font-black leading-tight">
              {deepDive && mission.journeyId
                ? mission.title.replace(/ — Unit.*$/, "").replace(/: Lesson \d+.*$/, "").split(":")[0]
                : mission.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
              {deepDive ? (mission.journeyDescription || mission.description) : mission.description}
            </p>
          </div>

          {!deepDive && (
            <div
              className="rounded-2xl px-4 py-3 text-xs font-medium leading-relaxed text-[#39ff14]"
              style={{ background: "rgba(57,255,20,0.1)", borderLeft: "3px solid #39ff14" }}
            >
              💡 <span className="font-bold">Apply now:</span>{" "}
              {mission.applyInstruction?.split("\n")[0]}
            </div>
          )}

          {deepDive && (
            <div
              className="rounded-2xl px-4 py-3 text-xs leading-relaxed"
              style={{ background: "rgba(57,255,20,0.08)", borderLeft: "3px solid #39ff14" }}
            >
              <span className="font-bold text-[#39ff14]">🗺️ Multi-lesson journey</span>
              <span className="text-muted-foreground ml-1.5">
                — progress at your own pace through {mission.totalLessons} guided lessons
              </span>
            </div>
          )}

          <button
            onClick={() => navigate(deepDive ? "/missions" : `/mission/${mission.id}`)}
            className="w-full py-4 rounded-2xl text-base font-black text-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            style={{
              background: deepDive ? "#39ff14" : "#00f5ff",
              boxShadow: deepDive
                ? "0 0 20px rgba(57,255,20,0.4)"
                : "0 0 20px rgba(0,245,255,0.4)",
            }}
          >
            {deepDive ? <>🗺️ View All Journeys</> : <><Zap className="w-5 h-5" /> Start Boost</>}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No boosts yet — check back soon 🚀
        </div>
      )}

      {/* ── Weekly impact ── */}
      <div className="rounded-3xl border bg-card p-4 space-y-3" style={{ borderColor: "rgba(57,255,20,0.2)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#39ff14]" />
            <span className="text-sm font-bold">This Week's Impact</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Mon–Sun</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          {[
            { value: String(weeklyStats.missions), label: "Boosts",    color: "#00f5ff" },
            { value: String(weeklyStats.weeklyXp), label: "XP Earned", color: "#39ff14" },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>{weeklyStats.missions} / {weeklyGoal} boosts this week</span>
            <span className="font-semibold text-[#39ff14]">{weekPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${weekPct}%`, background: "linear-gradient(90deg, #39ff14, #00f5ff)" }}
            />
          </div>
        </div>
      </div>

      {/* ── Recent Wins carousel ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold">Recent Impact</h3>
          {recentWins.length > 0 && (
            <button className="flex items-center gap-0.5 text-xs font-semibold text-[#00f5ff]">
              All impact <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {recentWins.length === 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="shrink-0 w-44 rounded-3xl border bg-card p-3.5 space-y-2 flex flex-col items-center justify-center text-center">
              <span className="text-2xl">🎯</span>
              <p className="text-xs font-bold leading-snug">No wins logged yet</p>
              <p className="text-[10px] text-muted-foreground leading-snug">Complete your first Boost and tap 'I Applied It' to log your first win.</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {recentWins.map((win) => {
              const color = CATEGORY_COLORS[win.category] ?? "#00f5ff";
              return (
                <div
                  key={win.id}
                  className="shrink-0 w-44 rounded-2xl border bg-card p-3.5 space-y-2.5 snap-start"
                  style={{ borderColor: `${color}33` }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${color}22`, color }}
                    >
                      {win.category ?? "boost"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {win.appliedAt
                        ? new Date(win.appliedAt).toLocaleDateString("en", { month: "short", day: "numeric" })
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-snug line-clamp-2">{win.note ?? "Impact logged"}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Signal of the Day ── */}
      {todaySignal && (
        <div
          className="rounded-3xl border p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            borderColor: "rgba(167,139,250,0.45)",
            background: "linear-gradient(135deg, rgba(167,139,250,0.09), rgba(0,245,255,0.04))",
            boxShadow: "0 0 30px rgba(167,139,250,0.08)",
          }}
          onClick={() => navigate(`/signals/${todaySignal.id}`)}
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#a78bfa]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#a78bfa]">Signal of the Day</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{todaySignal.date}</span>
          </div>
          <h3 className="text-sm font-black leading-snug">{todaySignal.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{todaySignal.shortTeaser}</p>
          <div className="flex items-center gap-0.5 text-xs font-bold text-[#a78bfa]">
            Read Full Signal <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

    </div>
    </>
  );
}