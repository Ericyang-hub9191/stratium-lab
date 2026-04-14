import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Zap, Archive } from "lucide-react";
import { getSignalByDate, SIGNALS } from "@/lib/signals-data";

const CATEGORY_LABELS = {
  prompting:   "Prompting",
  writing:     "Writing",
  research:    "Research",
  automation:  "Automation",
  rag:         "RAG",
  python:      "Python",
  data:        "Data",
  productivity:"Productivity",
};

export default function SignalDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  // Find signal by id
  const signal = SIGNALS.find(s => s.id === id) ?? null;

  if (!signal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-4xl">📡</p>
        <p className="text-muted-foreground text-sm">Signal not found.</p>
        <button onClick={() => navigate("/signals")} className="text-sm font-bold text-[#a78bfa]">← Back to Signals</button>
      </div>
    );
  }

  const formattedDate = new Date(signal.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border bg-secondary flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span
          className="text-[10px] font-black px-2.5 py-1 rounded-full text-black"
          style={{ background: "#a78bfa" }}
        >
          📡 SIGNAL
        </span>
        <button
          onClick={() => navigate("/signals")}
          className="ml-auto flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl border transition-all active:scale-95"
          style={{ borderColor: "rgba(167,139,250,0.4)", color: "#a78bfa", background: "rgba(167,139,250,0.08)" }}
        >
          <Archive className="w-3.5 h-3.5" /> See All Signals
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-24 max-w-2xl mx-auto w-full">

        {/* Date */}
        <div className="text-xs text-muted-foreground font-semibold">{formattedDate}</div>

        {/* Title */}
        <h1 className="text-2xl font-black leading-tight">{signal.title}</h1>

        {/* Short teaser pill */}
        <div
          className="rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed"
          style={{
            background: "rgba(167,139,250,0.1)",
            borderLeft: "3px solid #a78bfa",
            color: "#a78bfa",
          }}
        >
          {signal.shortTeaser}
        </div>

        {/* Full text */}
        <div className="space-y-4">
          {signal.fullText.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm text-foreground leading-relaxed">{para}</p>
          ))}
        </div>

        {/* Source */}
        <div
          className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ borderColor: "rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.04)" }}
        >
          <ExternalLink className="w-4 h-4 text-[#00f5ff] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#00f5ff] mb-1">Source</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{signal.source}</p>
          </div>
        </div>

        {/* Apply This Insight CTA */}
        {signal.relatedCategory && (
          <div
            className="rounded-3xl border p-5 space-y-3"
            style={{
              borderColor: "rgba(57,255,20,0.3)",
              background: "linear-gradient(135deg, rgba(57,255,20,0.06), rgba(0,245,255,0.03))",
            }}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#39ff14] mb-1">Apply This Insight</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This signal relates to <span className="font-bold text-foreground">{CATEGORY_LABELS[signal.relatedCategory] ?? signal.relatedCategory}</span>. 
                Try a Quick-Win mission in that category to immediately apply what you've learned.
              </p>
            </div>
            <button
              onClick={() => navigate("/missions")}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-black flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: "linear-gradient(90deg, #39ff14, #00f5ff)",
                boxShadow: "0 0 20px rgba(57,255,20,0.3)",
              }}
            >
              <Zap className="w-4 h-4" /> Find a {CATEGORY_LABELS[signal.relatedCategory]} Mission
            </button>
          </div>
        )}

      </div>
    </div>
  );
}