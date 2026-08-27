import { fmtCrore, type AnalysisResult } from "@/lib/mf-catalog";

/**
 * Fund size across the whole screened category. AUM now arrives with the analysis itself
 * (public scheme API), so there is nothing to load on demand and no "AUM not present" state
 * beyond individual schemes the source does not publish.
 */
export function CategorySizePanel({
  categoryLabel,
  result,
}: {
  categoryLabel: string;
  result: AnalysisResult;
}) {
  const flowNote = result.funds.find((f) => f.flowNote)?.flowNote ?? null;
  const rows = [...result.funds].sort((a, b) => (b.aumCrore ?? -1) - (a.aumCrore ?? -1));
  const missing = result.funds.length - result.aum.covered;

  return (
    <div className="panel mt-6 p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Fund size &amp; flows · {categoryLabel} category
      </h2>
      <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
        Current AUM for every screened scheme ({result.aum.covered} of {result.funds.length} covered
        {missing > 0 ? `, ${missing} not published by the source` : ""}). Smallest, largest and
        average are computed across all of them. Quarterly flow is the change in fund size that
        market movement cannot explain — i.e. money investors actually added or withdrew.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Smallest in category" value={fmtCrore(result.aum.min)} />
        <Stat label="Average" value={fmtCrore(result.aum.avg)} />
        <Stat label="Largest in category" value={fmtCrore(result.aum.max)} />
        <Stat
          label={`Ranking floor (${Math.round(result.screen.minAumShare * 100)}% of avg)`}
          value={fmtCrore(result.aum.floor)}
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="pb-2 font-medium">Fund</th>
              <th className="pb-2 text-right font-medium">AUM</th>
              <th className="pb-2 text-right font-medium">vs category avg</th>
              <th className="pb-2 text-right font-medium">Flow Q−1</th>
              <th className="pb-2 text-right font-medium">Flow Q−2</th>
            </tr>
          </thead>
          <tbody className="num">
            {rows.map((f) => (
              <tr key={f.code} className="border-t border-border">
                <td className="py-2 font-sans">{f.name}</td>
                <td className="py-2 text-right">{fmtCrore(f.aumCrore)}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {f.aumVsAvg === null
                    ? "—"
                    : `${f.aumVsAvg >= 1 ? "+" : ""}${((f.aumVsAvg - 1) * 100).toFixed(0)}%`}
                </td>
                <td className="py-2 text-right">{flow(f.flowQ1)}</td>
                <td className="py-2 text-right">{flow(f.flowQ2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {flowNote && <p className="mt-3 text-xs text-muted-foreground">{flowNote}</p>}
    </div>
  );
}

function flow(value: number | null) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={value >= 0 ? "text-positive" : "text-negative"}>
      {value >= 0 ? "+" : "−"}₹{Math.abs(Math.round(value)).toLocaleString("en-IN")} cr
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="num mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
