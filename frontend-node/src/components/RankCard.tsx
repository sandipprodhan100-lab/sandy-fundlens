import { useState } from "react";
import {
  ChevronDown,
  Gauge,
  LineChart as LineIcon,
  RotateCcw,
  RotateCw,
  TrendingDown,
} from "lucide-react";

import {
  fmtCagr,
  fmtCrore,
  fmtPct,
  prettyDate,
  type FundProfile,
  type FundResult,
  type HoldingsResult,
} from "@/lib/mf-catalog";
import { FundProfilePanel } from "@/components/FundProfilePanel";
import { HoldingsPanel } from "@/components/HoldingsPanel";

const fmtRatio = (v: number | null) => (v === null ? "—" : v.toFixed(2));
const fmtFlowShort = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : "−"}₹${Math.abs(Math.round(v)).toLocaleString("en-IN")} cr`;

/**
 * Ranked fund card. The face carries the headline numbers; clicking it flips the
 * card over to the full metric sheet. Deep panels stay below the flip surface.
 */
export function RankCard({
  fund: f,
  rank,
  accent,
  isPro,
  onFocusFund,
  onProfileLoaded,
  onHoldingsLoaded,
}: {
  fund: FundResult;
  rank: number;
  accent: string;
  isPro: boolean;
  onFocusFund: (fund: { code: number; name: string }) => void;
  onProfileLoaded: (code: number, profile: FundProfile) => void;
  onHoldingsLoaded: (code: number, result: HoldingsResult) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openHoldings, setOpenHoldings] = useState(false);

  const faceClass = "flip-face rounded-xl border border-border bg-surface p-4";

  return (
    <article className="flex flex-col">
      <div className="flip-shell">
        <div
          className={`flip-inner h-[26rem] ${flipped ? "is-flipped" : ""}`}
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
              <span className="num">{f.upDays.toFixed(0)}% up days</span>
            </div>
            <h3 className="mt-3 text-base font-semibold leading-snug">{f.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {f.house} · <span className="num">{fmtCrore(f.aumCrore)}</span> AUM
              {f.aumVsAvg !== null && (
                <span className="num">
                  {" "}
                  ({f.aumVsAvg >= 1 ? "+" : ""}
                  {((f.aumVsAvg - 1) * 100).toFixed(0)}% vs avg)
                </span>
              )}
            </p>
            {(f.flowQ1 !== null || f.flowQ2 !== null) && (
              <p className="num mt-1 text-xs text-muted-foreground">
                Net flow: {fmtFlowShort(f.flowQ1)} last quarter · {fmtFlowShort(f.flowQ2)} prior
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full border border-border px-2 py-0.5 capitalize">
                {f.sizeBucket} cap
              </span>
              <span className="rounded-full border border-primary/50 px-2 py-0.5 capitalize text-primary">
                {f.styleBucket}
              </span>
            </div>

            <div className="num mt-5 font-display text-4xl font-semibold text-positive">
              {fmtPct(f.return)}
            </div>
            <p className="eyebrow mt-1">Return inside the flat window</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Alpha", v: fmtPct(f.alpha), good: f.alpha >= 0 },
                { k: "Max DD", v: `${f.maxDrawdown.toFixed(1)}%`, good: false },
                { k: "Sharpe", v: fmtRatio(f.sharpe), good: (f.sharpe ?? 0) > 0 },
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
              <RotateCw className="size-3" /> Click the card for the full metric sheet
            </p>
          </div>

          {/* back */}
          <div className={`${faceClass} flip-back`} style={{ borderTop: `3px solid ${accent}` }}>
            <div className="flex items-center justify-between">
              <p className="eyebrow">Metric sheet · rank {rank}</p>
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <RotateCcw className="size-3" /> back
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug">{f.name}</p>

            <dl className="num mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1">
                  <LineIcon className="size-3" /> Alpha vs index
                </dt>
                <dd className={f.alpha >= 0 ? "text-positive" : "text-negative"}>
                  {fmtPct(f.alpha)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1">
                  <TrendingDown className="size-3" /> Max drawdown
                </dt>
                <dd>{f.maxDrawdown.toFixed(2)}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1">
                  <Gauge className="size-3" /> Volatility (ann.)
                </dt>
                <dd>{f.volatility.toFixed(1)}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Sharpe / Sortino / Treynor</dt>
                <dd className="text-foreground/90">
                  {fmtRatio(f.sharpe)} · {fmtRatio(f.sortino)} · {fmtRatio(f.treynor)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Return when index fell</dt>
                <dd
                  className={
                    f.drawdownReturn >= f.benchDrawdownReturn ? "text-positive" : "text-negative"
                  }
                >
                  {fmtPct(f.drawdownReturn)} vs {fmtPct(f.benchDrawdownReturn)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Rolling 3M win rate</dt>
                <dd>{f.consistency.toFixed(0)}%</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Composite score</dt>
                <dd className="text-foreground/90">{f.score.toFixed(2)}</dd>
              </div>
            </dl>

            <div className="mt-3 border-t border-border pt-3">
              <p className="eyebrow text-[10px]">CAGR to {prettyDate(f.cagrAsOf)}</p>
              <div className="num mt-1.5 grid grid-cols-4 gap-2 text-center text-xs">
                {(
                  [
                    ["1Y", f.cagr1y],
                    ["3Y", f.cagr3y],
                    ["5Y", f.cagr5y],
                    ["SI", f.cagrSince],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border py-1">
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                    <div
                      className={
                        value === null
                          ? "text-muted-foreground"
                          : value >= 0
                            ? "text-positive"
                            : "text-negative"
                      }
                    >
                      {fmtCagr(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
          {openProfile && (
            <FundProfilePanel schemeCode={f.code} fundName={f.name} onLoaded={onProfileLoaded} />
          )}
          <button
            onClick={() => setOpenHoldings((v) => !v)}
            className="mt-3 inline-flex w-full items-center justify-between gap-1 border-t border-border pt-3 text-xs font-medium text-primary"
          >
            Top 10 holdings
            <ChevronDown
              className={`size-3 transition-transform ${openHoldings ? "rotate-180" : ""}`}
            />
          </button>
          {openHoldings && (
            <HoldingsPanel schemeCode={f.code} fundName={f.name} onLoaded={onHoldingsLoaded} />
          )}
        </div>
      )}
    </article>
  );
}
