import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Layers } from "lucide-react";

import { analyseCombinedWindows } from "@/lib/mf.functions";
import { fmtCrore, fmtPct, prettyDate, type CategoryKey, type IndexKey } from "@/lib/mf-catalog";
import { FundChartPanel } from "@/components/FundChartPanel";
import { CombinedCard } from "@/components/CombinedCard";
import { CombinedVisuals } from "@/components/CombinedVisuals";
import { CalculatorSection } from "@/components/CalculatorSection";

import { RatioGuide } from "@/components/RatioGuide";
import { RankingMethodology } from "@/components/Methodology";

const ACCENTS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function CombinedRanking({
  category,
  categoryLabel,
  indexKey,
  isPro = false,
  onUnlock,
}: {
  category: CategoryKey;
  categoryLabel: string;
  indexKey: IndexKey;
  isPro?: boolean;
  onUnlock?: React.ReactNode;
}) {
  const [focusFund, setFocusFund] = useState<{ code: number; name: string } | null>(null);
  const query = useQuery({
    queryKey: ["combined", category, indexKey],
    queryFn: () => analyseCombinedWindows({ data: { category, indexKey } }),
    staleTime: 1000 * 60 * 30,
  });

  if (query.isPending) {
    return (
      <div className="panel flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Scoring {categoryLabel} funds across the last three sideways phases…
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="panel p-6 text-sm text-destructive">{(query.error as Error).message}</div>
    );
  }
  const data = query.data!;
  const top = data.funds.slice(0, 15);
  const detail = data.funds.slice(0, 5);
  const span = data.windows.length
    ? {
        start: data.windows.map((w) => w.start).sort()[0]!,
        end: data.windows
          .map((w) => w.end)
          .sort()
          .slice(-1)[0]!,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="panel p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Layers className="size-5 text-primary" /> Combined ranking · last {data.windows.length}{" "}
          sideways phases
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each phase is ranked separately with the {categoryLabel} scoring model, then blended. A
          fund's combined score is its average phase score scaled by how many of the{" "}
          {data.windows.length} phases it qualified in — so one lucky window cannot beat sustained
          performance.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {data.windows.map((w) => (
            <div key={w.start} className="rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-medium">
                {prettyDate(w.start)} → {prettyDate(w.end)}
              </div>
              <div className="num mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{w.days} days flat</span>
                <span>drift {fmtPct(w.drift)}</span>
                <span>band {w.band.toFixed(1)}%</span>
              </div>
            </div>
          ))}
          {data.windows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No qualifying sideways phase found for this benchmark.
            </p>
          )}
        </div>
      </div>

      {detail.length > 0 && (
        <div className="space-y-4">
          <h3 className="eyebrow">
            Top {detail.length} — click a card for the phase-by-phase sheet
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {detail.map((f, i) => (
              <CombinedCard
                key={f.code}
                fund={f}
                rank={i + 1}
                accent={ACCENTS[i % ACCENTS.length]!}
                phases={data.windows.length}
                isPro={isPro}
                onFocusFund={setFocusFund}
              />
            ))}
          </div>
          {!isPro && onUnlock}
        </div>
      )}

      {span && (
        <CalculatorSection
          category={category}
          categoryLabel={`${categoryLabel} · combined span`}
          indexKey={indexKey}
          start={span.start}
          end={span.end}
          onUnlock={onUnlock}
        />
      )}

      {data.funds.length > 0 && (

        <CombinedVisuals
          funds={data.funds}
          indexLabel={data.indexLabel}
          phases={data.windows.length}
          onFocusFund={setFocusFund}
        />
      )}

      {top.length > 0 && (
        <div className="panel overflow-x-auto p-5 sm:p-6">
          <h3 className="eyebrow">Combined leaderboard</h3>
          <table className="mt-4 w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Fund</th>
                <th className="py-2 pr-3 text-right">Combined</th>
                <th className="py-2 pr-3 text-right">Avg score</th>
                <th className="py-2 pr-3 text-right">Avg alpha</th>
                <th className="py-2 pr-3 text-right">Phases</th>
                <th className="py-2 pr-3 text-right">Best / worst rank</th>
                <th className="py-2 pr-3">Per phase</th>
              </tr>
            </thead>
            <tbody>
              {top.map((f, i) => (
                <tr key={f.code} className="border-b border-border/60 align-top">
                  <td className="num py-3 pr-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      className="text-left font-medium leading-snug hover:text-primary hover:underline"
                      onClick={() => setFocusFund({ code: f.code, name: f.name })}
                    >
                      {f.name}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      {f.house} · <span className="num">{fmtCrore(f.aumCrore)}</span>
                    </div>
                  </td>

                  <td className="num py-3 pr-3 text-right font-semibold">
                    {f.combinedScore.toFixed(1)}
                  </td>
                  <td className="num py-3 pr-3 text-right">{f.avgScore.toFixed(1)}</td>
                  <td
                    className={`num py-3 pr-3 text-right ${f.avgAlpha >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {fmtPct(f.avgAlpha)}
                  </td>
                  <td className="num py-3 pr-3 text-right">
                    {f.appearances}/{data.windows.length}
                  </td>
                  <td className="num py-3 pr-3 text-right">
                    {f.bestRank} / {f.worstRank}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {f.windows.map((w) => (
                        <span
                          key={w.start}
                          className="num rounded-full border border-border px-2 py-0.5"
                          title={`${prettyDate(w.start)} → ${prettyDate(w.end)}`}
                        >
                          #{w.rank} · {fmtPct(w.alpha)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {focusFund && span && (
        <FundChartPanel
          code={focusFund.code}
          name={focusFund.name}
          indexKey={indexKey}
          start={span.start}
          end={span.end}
          onClose={() => setFocusFund(null)}
        />
      )}




      <RatioGuide category={category} categoryLabel={categoryLabel} />

      <div className="panel p-5 sm:p-6">
        <RankingMethodology />
      </div>
    </div>
  );
}
