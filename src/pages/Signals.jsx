import { useNavigate } from "react-router-dom";
import { ChevronRight, Radio } from "lucide-react";
import { fetchSignalsGroupedByMonth, fetchTodaySignal } from "@/lib/signals-data";
import { useState, useEffect } from "react";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatMonthKey(key) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

function formatDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDate();
}

export default function Signals() {
  const navigate    = useNavigate();
  const today       = new Date().toISOString().split("T")[0];
  const [groups, setGroups]         = useState({});
  const [todaySignal, setTodaySignal] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      const [grp, sig] = await Promise.all([fetchSignalsGroupedByMonth(), fetchTodaySignal()]);
      setGroups(grp);
      setTodaySignal(sig);
      setLoading(false);
    })();
  }, []);

  const monthKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#a78bfa] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-6 pb-24">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-5 h-5 text-[#a78bfa]" />
          <h1 className="text-2xl font-black">Signals</h1>
        </div>
        <p className="text-xs text-muted-foreground">Frontier AI intelligence — one signal per day.</p>
      </div>

      {/* Today's Signal highlight */}
      {todaySignal && (
        <div
          className="rounded-3xl border p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            borderColor: "rgba(167,139,250,0.5)",
            background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(0,245,255,0.05))",
            boxShadow: "0 0 30px rgba(167,139,250,0.1)",
          }}
          onClick={() => navigate(`/signals/${todaySignal.id}`)}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full text-black"
              style={{ background: "#a78bfa" }}
            >
              📡 TODAY'S SIGNAL
            </span>
            <span className="text-[10px] text-muted-foreground">{todaySignal.date}</span>
          </div>
          <h2 className="text-base font-black leading-snug">{todaySignal.title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">{todaySignal.shortTeaser}</p>
          <div className="flex items-center gap-1 text-xs font-bold text-[#a78bfa]">
            Read Full Signal <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Monthly archive */}
      {monthKeys.map(monthKey => (
        <div key={monthKey} className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
            {formatMonthKey(monthKey)}
          </h2>
          <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
            {groups[monthKey].map(signal => {
              const isToday = signal.date === today;
              return (
                <button
                  key={signal.id}
                  onClick={() => navigate(`/signals/${signal.id}`)}
                  className="w-full flex items-start gap-4 px-4 py-3.5 text-left hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
                >
                  {/* Day number */}
                  <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                    style={isToday
                      ? { background: "#a78bfa", color: "#000" }
                      : { background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    {formatDay(signal.date)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-snug ${isToday ? "text-[#a78bfa]" : ""}`}>
                      {signal.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {signal.shortTeaser}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}