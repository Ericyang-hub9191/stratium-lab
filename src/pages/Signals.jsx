/* ─────────────────────────────────────────────────────────────
   Signals — daily AI news.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function groupByMonth(signals) {
  const groups = {};
  signals.forEach(s => {
    if (!s.date) return;
    const [y, m] = s.date.split("-");
    const key = `${y}-${m}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  Object.values(groups).forEach(arr => arr.sort((a, b) => b.date.localeCompare(a.date)));
  return groups;
}

export default function Signals() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.Signal.list("-date", 200);
        if (!cancelled) setSignals(all);
      } catch (e) {
        console.error("Signals load failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" /></div>;
  }

  const todayKey = new Date().toISOString().split("T")[0];
  const today = signals.find(s => s.date === todayKey);
  const archive = signals.filter(s => s.date !== todayKey);
  const grouped = groupByMonth(archive);
  const monthKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-7">

      <div className="space-y-1">
        <div className="ui-eyebrow flex items-center gap-1.5"><Radio className="w-3 h-3 text-accent" /> Signals</div>
        <h1 className="text-2xl md:text-3xl ui-heading">Frontier AI, one item per day.</h1>
      </div>

      {today && (
        <article
          onClick={() => navigate(`/signals/${today.slug ?? today.id}`)}
          className="cursor-pointer rounded-xl border border-border-strong bg-surface-1 p-5 md:p-6 hover:border-accent transition-colors"
        >
          <div className="ui-eyebrow text-accent mb-2">Today</div>
          <h2 className="text-lg md:text-xl ui-heading mb-2">{today.title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{today.teaser}</p>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-text-muted">{today.sourceName}</span>
            <span className="text-accent flex items-center gap-1">Read <ChevronRight className="w-3 h-3" /></span>
          </div>
        </article>
      )}

      {!today && signals.length === 0 && (
        <div className="rounded-lg border border-border bg-surface-1 p-6 text-center text-sm text-text-secondary">
          No signals yet. Check back soon.
        </div>
      )}

      {monthKeys.map(key => {
        const [y, m] = key.split("-");
        return (
          <section key={key}>
            <h3 className="text-xs ui-eyebrow text-text-muted mb-2 px-1">{MONTH_NAMES[parseInt(m, 10) - 1]} {y}</h3>
            <div className="rounded-lg border border-border bg-surface-1 divide-y divide-border overflow-hidden">
              {grouped[key].map(s => {
                const day = new Date(s.date + "T12:00:00").getDate();
                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/signals/${s.slug ?? s.id}`)}
                    className="w-full text-left flex items-start gap-4 px-4 py-3 hover:bg-surface-2/50 transition-colors"
                  >
                    <span className="shrink-0 w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center text-xs font-medium text-text-secondary tabular-nums mt-0.5">
                      {day}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary leading-snug">{s.title}</div>
                      <div className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">{s.teaser}</div>
                      <div className="text-[11px] text-text-muted mt-1.5">{s.sourceName}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-2" />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}