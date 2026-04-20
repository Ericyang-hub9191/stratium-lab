/* ─────────────────────────────────────────────────────────────
   SignalDetail — single-signal reader.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, BookOpen, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SignalDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedJourney, setRelatedJourney] = useState(null);
  const [relatedBoost, setRelatedBoost] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let results = await base44.entities.Signal.filter({ slug });
        if (!results.length) results = await base44.entities.Signal.filter({ id: slug });
        const sig = results[0] ?? null;
        if (cancelled) return;
        setSignal(sig);

        if (sig?.relatedJourneySlug) {
          const j = await base44.entities.Journey.filter({ slug: sig.relatedJourneySlug });
          if (!cancelled) setRelatedJourney(j[0] ?? null);
        }
        if (sig?.relatedBoostSlug) {
          const b = await base44.entities.Boost.filter({ slug: sig.relatedBoostSlug });
          if (!cancelled) setRelatedBoost(b[0] ?? null);
        }
      } catch (e) {
        console.error("Signal load failed:", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" /></div>;
  }
  if (!signal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-bg">
        <p className="text-text-secondary">Signal not found.</p>
        <button onClick={() => navigate("/signals")} className="btn btn-ghost">All signals</button>
      </div>
    );
  }

  const formattedDate = new Date(signal.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const paragraphs = (signal.body ?? "").split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost !py-1.5 !px-2.5" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="ui-eyebrow text-accent">Signal · {signal.sourceName}</div>
        </div>
      </div>

      <div className="flex-1 reading-surface py-10 md:py-14 px-4 md:px-8 animate-fade-in">
        <article className="max-w-2xl mx-auto pb-16">
          <div className="eyebrow mb-3">{formattedDate}</div>
          <h1 className="!mt-0 !mb-3">{signal.title}</h1>
          <p className="text-[1.15em] muted !mt-1 mb-6" style={{ lineHeight: 1.5 }}>{signal.teaser}</p>

          <div className="space-y-5 mt-8">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <a
            href={signal.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="reading-card rounded-xl p-4 flex items-start gap-3 mt-10 no-underline hover:border-[hsl(var(--reading-accent))] transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--reading-accent))" }} />
            <div className="flex-1 min-w-0">
              <div className="font-medium" style={{ color: "hsl(var(--reading-text))" }}>Read the source</div>
              <div className="text-[0.88em] mt-1 muted truncate">{signal.sourceUrl}</div>
            </div>
          </a>

          {(relatedJourney || relatedBoost) && (
            <div className="mt-10 pt-6 border-t" style={{ borderColor: "hsl(var(--reading-border))" }}>
              <div className="eyebrow mb-3">Act on this</div>
              <div className="space-y-2">
                {relatedJourney && (
                  <button
                    onClick={() => navigate(`/journey/${relatedJourney.slug}`)}
                    className="reading-card w-full text-left rounded-xl p-4 flex items-start gap-3 hover:border-[hsl(var(--reading-accent))] transition-colors"
                  >
                    <BookOpen className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--reading-accent))" }} />
                    <div>
                      <div className="font-medium" style={{ color: "hsl(var(--reading-text))" }}>{relatedJourney.title}</div>
                      <div className="text-[0.88em] mt-1 muted">{relatedJourney.subtitle}</div>
                    </div>
                  </button>
                )}
                {relatedBoost && (
                  <button
                    onClick={() => navigate(`/boost/${relatedBoost.id}`)}
                    className="reading-card w-full text-left rounded-xl p-4 flex items-start gap-3 hover:border-[hsl(var(--reading-accent))] transition-colors"
                  >
                    <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--reading-accent))" }} />
                    <div>
                      <div className="font-medium" style={{ color: "hsl(var(--reading-text))" }}>{relatedBoost.title}</div>
                      <div className="text-[0.88em] mt-1 muted">{relatedBoost.subtitle}</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}