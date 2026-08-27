import { useState } from "react";
import { ChevronDown, Layers, RotateCcw, RotateCw, Trophy } from "lucide-react";

import { fmtCrore, fmtPct, prettyDate, type CombinedFund } from "@/lib/mf-catalog";
import { FundProfilePanel } from "@/components/FundProfilePanel";
import { HoldingsPanel } from "@/components/HoldingsPanel";

/**
 * Combined-ranking fund card. The face carries the blended headline; clicking it
 * flips to the phase-by-phase sheet. Deep panels stay below the flip surface.
 */
export function CombinedCard({
  fund: f,
  rank,
  accent,
  phases,
  isPro,
  onFocusFund,
}: {
  fund: CombinedFund;
  rank: number;
  accent: string;
  phases: number;
  isPro: boolean;
  onFocusFund: (fund: { code: number; name: string }) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openHoldings, setOpenHoldings] = useState(false);

  const faceClass = "flip-face rounded-xl border border-border bg-surface p-4";
  const coverage = phases > 0 ? (f.appearances / phases) * 100 : 0;
  const m = f.metrics;
  const num = (v: number | null) => (v == null ? "—" : v.toFixed(2));

  return (
    <article className="flex flex-col">
      <div className="flip-shell">
        <div
          className={`flip-inner h-[34rem] ${flipped ? "is-flipped" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => setFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((v) => !v);
            }
          }}
        >
          {/* front */}
          <div className={`${faceClass} h-full`} style={{ borderTop: `3px solid ${accent}` }}>
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{
                  background: `color-mix(in oklab, ${accent} 16%, transparent)`,
                  color: accent,
                }}
              >
                Rank {rank}
              </span>
              <span className="num">
                {f.appearances}/{phases} phases
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold leading-snug">{f.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {f.house} · <span className="num">{fmtCrore(f.aumCrore)}</span> AUM
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full border border-border px-2 py-0.5 capitalize">
                {f.sizeBucket} cap
              </span>
              <span className="rounded-full border border-primary/50 px-2 py-0.5 capitalize text-primary">
                {f.styleBucket}
              </span>
            </div>

            <div className="num mt-5 font-display text-4xl font-semibold text-primary">
              {f.combinedScore.toFixed(1)}
            </div>
            <p className="eyebrow mt-1">Combined score across {phases} flat phases</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Avg alpha", v: fmtPct(f.avgAlpha), good: f.avgAlpha >= 0 },
                { k: "Avg score", v: f.avgScore.toFixed(1), good: false },
                { k: "Best rank", v: `#${f.bestRank}`, good: f.bestRank <= 3 },
              ].map((s) => (
                <div key={s.k} className="stat-tile px-2 py-2">
                  <p className="eyebrow text-[10px]">{s.k}</p>
                  <p
                    className={`num mt-0.5 text-sm font-semibold ${s.good ? "text-positive" : ""}`}
                  >
                    {s.v}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <RotateCw className="size-3" /> Click the card for the phase-by-phase sheet
            </p>
          </div>

          {/* back */}
          <div className={`${faceClass} flip-back`} style={{ borderTop: `3px solid ${accent}` }}>
            <div className="flex items-center justify-between">
              <p className="eyebrow">Phase sheet · rank {rank}</p>
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <RotateCcw className="size-3" /> back
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug">{f.name}</p>

            <table className="num mt-3 w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-1 pr-2">Phase</th>
                  <th className="py-1 pr-2 text-right">Rank</th>
                  <th className="py-1 pr-2 text-right">Return</th>
                  <th className="py-1 text-right">Alpha</th>
                </tr>
              </thead>
              <tbody>
                {f.windows.map((w) => (
                  <tr key={w.start} className="border-b border-border/60">
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {prettyDate(w.start)} → {prettyDate(w.end)}
                    </td>
                    <td className="py-1.5 pr-2 text-right">#{w.rank}</td>
                    <td className="py-1.5 pr-2 text-right">{fmtPct(w.return)}</td>
                    <td
                      className={`py-1.5 text-right ${w.alpha >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {fmtPct(w.alpha)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 border-t border-border pt-3">
              <p className="eyebrow text-[10px]">Blended ratio sheet</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                {[
                  { k: "Sharpe", v: num(m.sharpe) },
                  { k: "Sortino", v: num(m.sortino) },
                  { k: "Treynor", v: num(m.treynor) },
                  { k: "Avg return", v: fmtPct(m.avgReturn) },
                  { k: "Avg max DD", v: fmtPct(m.avgMaxDrawdown) },
                  { k: "Avg vol", v: `${m.avgVolatility.toFixed(1)}%` },
                  { k: "Beta", v: m.avgBeta.toFixed(2) },
                  { k: "Down capture", v: `${m.downCapture.toFixed(0)}%` },
                  { k: "Consistency", v: `${m.consistency.toFixed(0)}%` },
                ].map((s) => (
                  <div key={s.k} className="stat-tile px-1.5 py-1.5">
                    <p className="eyebrow text-[9px]">{s.k}</p>
                    <p className="num mt-0.5 text-xs font-semibold">{s.v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Window figures averaged across the phases this fund qualified in; trailing ratios
                {m.ratioBasis ? ` from ${m.ratioBasis}` : ""}.
              </p>
            </div>

            <dl className="num mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1">
                  <Layers className="size-3" /> Phase coverage
                </dt>
                <dd className="text-foreground/90">{coverage.toFixed(0)}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1">
                  <Trophy className="size-3" /> Best / worst rank
                </dt>
                <dd className="text-foreground/90">
                  #{f.bestRank} / #{f.worstRank}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Combined score</dt>
                <dd className="text-foreground/90">{f.combinedScore.toFixed(2)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFocusFund({ code: f.code, name: f.name });
              }}
              className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Chart this fund vs the benchmark
            </button>
          </div>
        </div>
      </div>

      {isPro && (
        <div className="rounded-b-xl border border-t-0 border-border bg-surface px-4 pb-3">
          <button
            onClick={() => setOpenProfile((v) => !v)}
            className="inline-flex w-full items-center justify-between gap-1 border-t border-border pt-3 text-xs font-medium text-primary"
          >
            Fund manager &amp; fund size
            <ChevronDown
              className={`size-3 transition-transform ${openProfile ? "rotate-180" : ""}`}
            />
          </button>
          {openProfile && <FundProfilePanel schemeCode={f.code} fundName={f.name} />}
          <button
            onClick={() => setOpenHoldings((v) => !v)}
            className="mt-3 inline-flex w-full items-center justify-between gap-1 border-t border-border pt-3 text-xs font-medium text-primary"
          >
            Top 10 holdings
            <ChevronDown
              className={`size-3 transition-transform ${openHoldings ? "rotate-180" : ""}`}
            />
          </button>
          {openHoldings && <HoldingsPanel schemeCode={f.code} fundName={f.name} />}
        </div>
      )}
    </article>
  );
}
