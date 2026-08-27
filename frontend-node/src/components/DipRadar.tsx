import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingDown } from "lucide-react";

import { scanDipFunds } from "@/lib/mf.functions";
import { fmtCrore, fmtPct, prettyDate, type CategoryKey, type IndexKey } from "@/lib/mf-catalog";

export function DipRadar({
  category,
  categoryLabel,
  indexKey,
}: {
  category: CategoryKey;
  categoryLabel: string;
  indexKey: IndexKey;
}) {
  const query = useQuery({
    queryKey: ["dips", category, indexKey],
    queryFn: () => scanDipFunds({ data: { category, indexKey } }),
    staleTime: 1000 * 60 * 30,
  });

  if (query.isPending) {
    return (
      <div className="panel flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Checking top-ranked {categoryLabel} funds against their 1-year NAV peak…
      </div>
    );
  }
  if (query.isError) {
    return <div className="panel p-6 text-sm text-destructive">{(query.error as Error).message}</div>;
  }
  const data = query.data!;

  return (
    <div className="space-y-6">
      <div className="panel p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <TrendingDown className="size-5 text-primary" /> Dip radar · {data.band.min}–
          {data.band.max}% off peak
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Top-ranked {categoryLabel} funds from the latest sideways phase (
          {data.window.start ? `${prettyDate(data.window.start)} → ${prettyDate(data.window.end)}` : "—"}
          ) whose current NAV sits {data.band.min}–{data.band.max}% below their highest NAV of the
          past year. A shallow dip in an already high-ranked fund — not a signal to buy, just a
          watchlist.
        </p>
        <p className="num mt-3 text-xs text-muted-foreground">
          {data.scanned} funds scanned · NAV as of {data.asOf ? prettyDate(data.asOf) : "—"}
        </p>
      </div>

      {data.funds.length === 0 ? (
        <div className="panel p-6 text-sm text-muted-foreground">
          No ranked fund in this category is currently {data.band.min}–{data.band.max}% below its
          1-year peak.
        </div>
      ) : (
        <div className="panel overflow-x-auto p-5 sm:p-6">
          <h3 className="eyebrow">Funds on a shallow dip</h3>
          <table className="mt-4 w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Fund</th>
                <th className="py-2 pr-3 text-right">Dip</th>
                <th className="py-2 pr-3 text-right">Peak NAV</th>
                <th className="py-2 pr-3 text-right">Latest NAV</th>
                <th className="py-2 pr-3 text-right">Alpha</th>
                <th className="py-2 pr-3 text-right">Sharpe</th>
                <th className="py-2 pr-3 text-right">3Y CAGR</th>
              </tr>
            </thead>
            <tbody>
              {data.funds.map((f) => (
                <tr key={f.code} className="border-b border-border/60">
                  <td className="num py-3 pr-3 text-muted-foreground">#{f.rank}</td>
                  <td className="py-3 pr-3">
                    <div className="font-medium leading-snug">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.house} · <span className="num">{fmtCrore(f.aumCrore)}</span>
                    </div>
                  </td>
                  <td className="num py-3 pr-3 text-right font-semibold text-negative">
                    −{f.dipPct.toFixed(1)}%
                  </td>
                  <td className="num py-3 pr-3 text-right">
                    {f.peakNav.toFixed(2)}
                    <div className="text-[11px] text-muted-foreground">{prettyDate(f.peakDate)}</div>
                  </td>
                  <td className="num py-3 pr-3 text-right">
                    {f.latestNav.toFixed(2)}
                    <div className="text-[11px] text-muted-foreground">
                      {prettyDate(f.latestDate)}
                    </div>
                  </td>
                  <td
                    className={`num py-3 pr-3 text-right ${f.alpha >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {fmtPct(f.alpha)}
                  </td>
                  <td className="num py-3 pr-3 text-right">
                    {f.sharpe === null ? "—" : f.sharpe.toFixed(2)}
                  </td>
                  <td className="num py-3 pr-3 text-right">
                    {f.cagr3y === null ? "—" : `${f.cagr3y.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
