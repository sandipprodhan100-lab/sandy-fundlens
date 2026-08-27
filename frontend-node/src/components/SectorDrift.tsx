import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Loader2, Lock, PieChart } from "lucide-react";

import { getSectorDriftFn } from "@/lib/analysis-extras.functions";

const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);

function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 ${up ? "text-positive" : "text-negative"}`}>
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {`${up ? "+" : "−"}${Math.abs(value).toFixed(1)}pp`}
    </span>
  );
}

export function SectorDrift({
  code,
  name,
  onUnlock,
}: {
  code: number;
  name: string;
  onUnlock?: React.ReactNode;
}) {
  const query = useQuery({
    queryKey: ["sector-drift", code],
    staleTime: 1000 * 60 * 60,
    queryFn: () => getSectorDriftFn({ data: { schemeCode: code, fundName: name } }),
  });

  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <PieChart className="size-4 text-primary" /> Sector allocation drift · 6m → 3m → now
      </h3>
      <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
        Where {name} has been adding and trimming exposure over the last two quarters.
      </p>

      {query.isPending ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Reading factsheet snapshots…
        </div>
      ) : query.isError ? (
        <p className="mt-4 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : query.data ? (
        <>
          <p className="mt-3 text-sm">{query.data.summary}</p>
          {query.data.rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Sector</th>
                    <th className="pb-2 text-right font-medium">6m ago</th>
                    <th className="pb-2 text-right font-medium">3m ago</th>
                    <th className="pb-2 text-right font-medium">Now</th>
                    <th className="pb-2 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {query.data.rows.map((r) => (
                    <tr key={r.sector} className="border-t border-border/70">
                      <td className="py-2 font-medium">{r.sector}</td>
                      <td className="py-2 text-right">{pct(r.m6)}</td>
                      <td className="py-2 text-right">{pct(r.m3)}</td>
                      <td className="py-2 text-right">{pct(r.now)}</td>
                      <td className="py-2 text-right">
                        <Delta value={r.change} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {query.data.locked && (
            <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4 text-primary" /> Full sector table
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Free shows the biggest add and the biggest trim. Pro shows every sector with its
                6-month, 3-month and current weight.
              </p>
              {onUnlock}
            </div>
          )}
          {query.data.note && (
            <p className="mt-3 text-xs text-muted-foreground">{query.data.note}</p>
          )}
          {query.data.source && (
            <p className="mt-1 text-[11px] text-muted-foreground">Source: {query.data.source}</p>
          )}
        </>
      ) : null}
    </section>
  );
}
