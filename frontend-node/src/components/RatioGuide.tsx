import { LOGIC_LOCKED } from "@/lib/app-edition";
import { CATEGORY_RATIO_FOCUS, RATIO_GUIDE, RISK_FREE, type CategoryKey } from "@/lib/mf-catalog";

export function RatioGuide({
  category,
  categoryLabel,
  locked = LOGIC_LOCKED,
}: {
  category: CategoryKey;
  categoryLabel: string;
  locked?: boolean;
}) {
  const focus = CATEGORY_RATIO_FOCUS[category];

  return (
    <div className="panel mt-6 p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Risk-adjusted return ratios
      </h2>
      <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
        {locked
          ? "Each ranked fund is measured on all three risk-adjusted ratios. The values are shown throughout the app; the formulas, risk-free assumption and category weighting are part of Pro."
          : null}
      </p>
      <p className={`mt-2 max-w-3xl text-xs text-muted-foreground ${locked ? "hidden" : ""}`}>
        All three ratios use a {RISK_FREE}% risk-free rate (Indian 364-day T-bill level) and are
        computed on trailing 3-year daily NAVs, so they reflect the manager's handling of risk well
        beyond the sideways window itself.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {RATIO_GUIDE.map((r) => (
          <div
            key={r.ratio}
            className={`rounded-xl border p-4 ${
              r.ratio === focus.primary ? "border-primary/60 bg-primary/5" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{r.ratio} ratio</h3>
              {r.ratio === focus.primary && (
                <span className="rounded-full border border-primary/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                  Lead for {categoryLabel}
                </span>
              )}
            </div>
            {!locked && (
              <>
                <p className="num mt-2 text-[11px] text-muted-foreground">{r.formula}</p>
                <p className="mt-2 text-xs text-foreground/85">{r.what}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">India: </span>
                  {r.india}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {!locked && (
      <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-xs">
        <p className="uppercase tracking-widest text-muted-foreground">
          How {categoryLabel} funds are ranked
        </p>
        <p className="mt-2 text-foreground/85">
          Lead ratio: <span className="font-medium text-primary">{focus.primary}</span>, supported by{" "}
          {focus.extra.toLowerCase()}. {focus.why}
        </p>
        <p className="mt-2 text-muted-foreground">
          The final score blends percentile ranks of window alpha, Sharpe, Sortino, Treynor, return
          earned on days the benchmark fell, rolling 3-month win rate against the benchmark
          (consistency of the manager), and max drawdown control — weighted for this category.
        </p>
      </div>
      )}
    </div>
  );
}
