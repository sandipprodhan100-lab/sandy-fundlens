import { useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";

import { fmtCagr, fmtCrore, fmtPct, type AnalysisResult, type FundResult } from "@/lib/mf-catalog";
import { Button } from "@/components/ui/button";
import { RankingMethodology } from "@/components/Methodology";

const fmtRatio = (v: number | null) => (v === null ? "—" : v.toFixed(2));

function Flow({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 ${up ? "text-positive" : "text-negative"}`}>
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {`${up ? "+" : "−"}₹${Math.abs(Math.round(value)).toLocaleString("en-IN")} cr`}
    </span>
  );
}

export function Leaderboard({
  result,
  onFocusFund,
}: {
  result: AnalysisResult;
  onFocusFund: (fund: { code: number; name: string }) => void;
}) {
  const [full, setFull] = useState(false);
  const ranked = result.funds.filter((f) => f.eligible);
  const screened = result.funds.filter((f) => !f.eligible);

  return (
    <div className="panel mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Full category leaderboard
          </h2>
          <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
            {ranked.length} of {result.analysed} schemes clear the eligibility screens — at least{" "}
            {result.screen.minAgeYears} years of NAV history and a fund size of at least{" "}
            {Math.round(result.screen.minAumShare * 100)}% of the category average (
            {fmtCrore(result.aum.floor)}). Everything else is listed below the ranked table, unscored.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setFull((v) => !v)}>
          {full ? "Clean view" : "Show all metrics"}
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className={`w-full text-sm ${full ? "min-w-[1240px]" : "min-w-[860px]"}`}>
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Fund</th>
              <th className="pb-2 text-right font-medium">AUM</th>
              <th className="pb-2 text-right font-medium">Flow Q−1</th>
              <th className="pb-2 text-right font-medium">Flow Q−2</th>
              <th className="pb-2 text-right font-medium">Return</th>
              <th className="pb-2 text-right font-medium">Alpha</th>
              <th className="pb-2 text-right font-medium">3Y CAGR</th>
              <th className="pb-2 text-right font-medium">Sharpe</th>
              {full && (
                <>
                  <th className="pb-2 text-right font-medium">Ann.</th>
                  <th className="pb-2 text-right font-medium">1Y CAGR</th>
                  <th className="pb-2 text-right font-medium">5Y CAGR</th>
                  <th className="pb-2 text-right font-medium">Sortino</th>
                  <th className="pb-2 text-right font-medium">Treynor</th>
                  <th className="pb-2 text-right font-medium">Consist.</th>
                  <th className="pb-2 text-right font-medium">Vol</th>
                  <th className="pb-2 text-right font-medium">Age</th>
                </>
              )}
              <th className="pb-2 text-right font-medium">Down-mkt</th>
              <th className="pb-2 text-right font-medium">Max DD</th>
              <th className="pb-2 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="num">
            {ranked.map((f, i) => (
              <Row key={f.code} fund={f} rank={i + 1} full={full} onFocusFund={onFocusFund} />
            ))}
          </tbody>
        </table>
      </div>

      {screened.length > 0 && (
        <div className="mt-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <AlertTriangle className="size-3.5 text-primary" /> Screened out ({screened.length})
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {screened.map((f) => (
              <li
                key={f.code}
                className="rounded-lg border border-dashed border-border px-3 py-2 text-xs"
              >
                <span className="font-medium">{f.name}</span>
                <span className="num ml-2 text-muted-foreground">{fmtCrore(f.aumCrore)}</span>
                <p className="mt-0.5 text-muted-foreground">{f.ineligibleReason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RankingMethodology />
    </div>
  );
}

function Row({
  fund: f,
  rank,
  full,
  onFocusFund,
}: {
  fund: FundResult;
  rank: number;
  full: boolean;
  onFocusFund: (fund: { code: number; name: string }) => void;
}) {
  return (
    <tr className="border-t border-border align-top">
      <td className="py-2.5 text-muted-foreground">{rank}</td>
      <td className="max-w-[280px] py-2.5 font-sans">
        <button
          className="text-left leading-snug hover:text-primary"
          onClick={() => onFocusFund({ code: f.code, name: f.name })}
        >
          {f.name}
        </button>
        <div className="text-[11px] capitalize text-muted-foreground">
          {f.sizeBucket} cap · {f.styleBucket}
        </div>
      </td>
      <td className="py-2.5 text-right">
        {fmtCrore(f.aumCrore)}
        {f.aumVsAvg !== null && (
          <div className="text-[11px] text-muted-foreground">
            {f.aumVsAvg >= 1 ? "+" : ""}
            {((f.aumVsAvg - 1) * 100).toFixed(0)}% vs avg
          </div>
        )}
      </td>
      <td className="py-2.5 text-right">
        <Flow value={f.flowQ1} />
      </td>
      <td className="py-2.5 text-right">
        <Flow value={f.flowQ2} />
      </td>
      <td className={`py-2.5 text-right ${f.return >= 0 ? "text-positive" : "text-negative"}`}>
        {fmtPct(f.return)}
      </td>
      <td className={`py-2.5 text-right ${f.alpha >= 0 ? "text-positive" : "text-negative"}`}>
        {fmtPct(f.alpha)}
      </td>
      <td className="py-2.5 text-right">{fmtCagr(f.cagr3y)}</td>
      <td className="py-2.5 text-right">{fmtRatio(f.sharpe)}</td>
      {full && (
        <>
          <td className="py-2.5 text-right">{fmtPct(f.annualised)}</td>
          <td className="py-2.5 text-right">{fmtCagr(f.cagr1y)}</td>
          <td className="py-2.5 text-right">{fmtCagr(f.cagr5y)}</td>
          <td className="py-2.5 text-right">{fmtRatio(f.sortino)}</td>
          <td className="py-2.5 text-right">{fmtRatio(f.treynor)}</td>
          <td className="py-2.5 text-right">{f.consistency.toFixed(0)}%</td>
          <td className="py-2.5 text-right">{f.volatility.toFixed(1)}%</td>
          <td className="py-2.5 text-right">{f.ageYears.toFixed(1)}y</td>
        </>
      )}
      <td
        className={`py-2.5 text-right ${f.drawdownReturn >= f.benchDrawdownReturn ? "text-positive" : "text-negative"}`}
      >
        {f.drawdownReturn.toFixed(1)}%
      </td>
      <td className="py-2.5 text-right">{f.maxDrawdown.toFixed(1)}%</td>
      <td className="py-2.5 text-right font-semibold">{f.score.toFixed(2)}</td>
    </tr>
  );
}
