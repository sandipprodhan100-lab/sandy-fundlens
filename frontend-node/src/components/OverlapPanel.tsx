import { useQuery } from "@tanstack/react-query";
import { Layers, Loader2, Lock } from "lucide-react";

import { getCommonHoldings } from "@/lib/analysis-extras.functions";
import type { CategoryKey, IndexKey } from "@/lib/mf-catalog";

export function OverlapPanel({
  category,
  indexKey,
  start,
  end,
  onUnlock,
}: {
  category: CategoryKey;
  indexKey: IndexKey;
  start: string;
  end: string;
  onUnlock?: React.ReactNode;
}) {
  const query = useQuery({
    queryKey: ["overlap", category, indexKey, start, end],
    staleTime: 1000 * 60 * 60,
    queryFn: () => getCommonHoldings({ data: { category, indexKey, start, end } }),
  });

  const data = query.data;

  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Layers className="size-4 text-primary" /> Common stocks across the top ranked funds
      </h3>
      <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
        Buying several funds from the same category often means buying the same companies several
        times. This is the overlap between the top ranked funds of this window.
      </p>

      {query.isPending ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Comparing portfolios…
        </div>
      ) : query.isError ? (
        <p className="mt-4 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : data ? (
        <>
          {data.overlapPct != null && (
            <p className="num mt-3 text-sm">
              Average pairwise portfolio overlap:{" "}
              <span className="font-display text-lg font-semibold">
                {data.overlapPct.toFixed(1)}%
              </span>{" "}
              <span className="text-muted-foreground">
                across {data.funds.length} ranked funds
              </span>
            </p>
          )}

          {data.stocks.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Stock</th>
                    <th className="pb-2 font-medium">Sector</th>
                    <th className="pb-2 text-right font-medium">Held by</th>
                    <th className="pb-2 text-right font-medium">Avg weight</th>
                    {!data.locked &&
                      data.funds.map((f) => (
                        <th key={f.code} className="pb-2 text-right font-medium">
                          #{f.rank}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="num">
                  {data.stocks.map((s) => (
                    <tr key={s.name} className="border-t border-border/70">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-muted-foreground">{s.sector ?? "—"}</td>
                      <td className="py-2 text-right">
                        {s.funds}/{data.funds.length}
                      </td>
                      <td className="py-2 text-right">
                        {s.avgWeight == null ? "—" : `${s.avgWeight.toFixed(2)}%`}
                      </td>
                      {!data.locked &&
                        data.funds.map((f) => (
                          <td key={f.code} className="py-2 text-right text-muted-foreground">
                            {s.weights[f.code] == null ? "—" : `${s.weights[f.code]!.toFixed(2)}%`}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.locked && (
                <ol className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                  {data.funds.map((f) => (
                    <li key={f.code}>
                      #{f.rank} {f.name}
                      {f.asOf ? ` · holdings as of ${f.asOf}` : ""}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No published holdings overlap available for this window yet.
            </p>
          )}

          {data.locked && (
            <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4 text-primary" /> Full overlap table
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Free shows the three most-shared stocks. Pro shows all ten with the exact weight
                each ranked fund holds.
              </p>
              {onUnlock}
            </div>
          )}
          {data.note && <p className="mt-3 text-xs text-muted-foreground">{data.note}</p>}
        </>
      ) : null}
    </section>
  );
}
