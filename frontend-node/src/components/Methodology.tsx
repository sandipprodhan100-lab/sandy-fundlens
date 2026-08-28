import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { LOGIC_LOCKED, isOpenEdition } from "@/lib/app-edition";
import { SIDEWAYS_RULE, fmtPct, type WindowStats } from "@/lib/mf-catalog";

function LockedNote({ what, demo }: { what: string; demo: boolean }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-surface/60 p-4">
      <p className="flex items-center gap-2 text-xs font-medium">
        <Lock className="size-3.5 text-primary" /> {what}
      </p>
      {isOpenEdition ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Every result stays free in this preview — the underlying maths ships with MF Lens Pro.
        </p>
      ) : (
        <Link
          to="/analysis"
          className="mt-1 inline-block text-xs text-primary underline"
        >
          Explore the full analysis
        </Link>
      )}
    </div>
  );
}


export function SidewaysMethodology({
  locked = LOGIC_LOCKED,
  demo = false,
}: {
  locked?: boolean;
  demo?: boolean;
}) {
  if (locked) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-surface/60 p-4">
        <p className="text-sm font-medium">How a “sideways” phase is defined</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          A phase qualifies when the benchmark stays flat for long enough, ends close to where it
          started and never swings too wide in between — three tests applied to the index NAV series.
        </p>
        <LockedNote
          what="Exact thresholds, the window-growing algorithm and why each date range qualifies are part of Pro."
          demo={demo}
        />
      </div>
    );
  }
  return (
    <details className="mt-3 rounded-xl border border-border bg-surface/60 p-4">
      <summary className="cursor-pointer text-sm font-medium">
        How a “sideways” phase is defined
      </summary>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <p>
          A phase counts as sideways when all three conditions hold on the benchmark's NAV series:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Length</strong> — at least {SIDEWAYS_RULE.minDays}{" "}
            calendar days.
          </li>
          <li>
            <strong className="text-foreground">Drift</strong> — the index ends within ±
            {SIDEWAYS_RULE.maxDrift}% of where it started.
          </li>
          <li>
            <strong className="text-foreground">Band</strong> — the entire high-to-low range inside the
            window stays under {SIDEWAYS_RULE.maxBand}%, so a crash-and-recovery does not sneak in as
            “flat”.
          </li>
        </ul>
        <p>
          Candidates are grown greedily from every fifth trading day and extended for as long as the band
          holds. Overlapping candidates are dropped in favour of the longest one, and the five most recent
          survivors are shown. Any custom date range you enter is measured against the same three tests.
        </p>
      </div>
    </details>
  );
}

export function WindowReason({
  w,
  indexLabel,
  locked = LOGIC_LOCKED,
}: {
  w: WindowStats;
  indexLabel: string;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <p className="text-xs leading-relaxed text-muted-foreground">
        {indexLabel} stayed broadly flat across these {w.days} days.{" "}
        <span className="text-primary">Full qualification maths is in Pro.</span>
      </p>
    );
  }
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      {indexLabel} moved {fmtPct(w.drift)} over {w.days} days while never swinging more than{" "}
      {w.band.toFixed(1)}% top-to-bottom — {" "}
      {w.qualifies ? (
        <span className="text-primary">
          meets all three sideways tests ({SIDEWAYS_RULE.minDays}+ days, ±{SIDEWAYS_RULE.maxDrift}% drift,
          under {SIDEWAYS_RULE.maxBand}% band).
        </span>
      ) : (
        <span className="text-sideways">
          a custom range: it misses at least one of the {SIDEWAYS_RULE.minDays}-day, ±
          {SIDEWAYS_RULE.maxDrift}% drift or {SIDEWAYS_RULE.maxBand}% band tests.
        </span>
      )}
    </p>
  );
}

export function RankingMethodology({
  locked = LOGIC_LOCKED,
  demo = false,
}: {
  locked?: boolean;
  demo?: boolean;
}) {
  if (locked) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4">
        <p className="text-sm font-medium">How funds are ranked</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Funds are scored on a blend of alpha inside the flat window, risk-adjusted ratios,
          behaviour on down days, rolling consistency and drawdown control — weighted differently
          for each category.
        </p>
        <LockedNote
          what="The exact formula, per-category weights, every column definition and the universe rules are part of Pro."
          demo={demo}
        />
      </div>
    );
  }
  return (
    <details className="mt-4 rounded-xl border border-border bg-surface/60 p-4">
      <summary className="cursor-pointer text-sm font-medium">How funds are ranked</summary>
      <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p className="num rounded-lg bg-background/60 p-3 text-sm text-foreground">
          Score = weighted percentile blend of Alpha · Sharpe · Sortino · Treynor · return on
          benchmark-down days · rolling 3M win rate · max drawdown control
        </p>
        <p>
          <strong className="text-foreground">Alpha</strong> is the fund's return inside the window minus
          the benchmark's return over the exact same dates. Every other input is measured on trailing
          3-year daily NAVs, so a fund cannot top the table on one lucky flat window. Weights vary by
          category — Treynor leads for large caps, Sortino for mid and small caps, Sharpe plus rolling
          consistency for multi and flexi caps.
        </p>
        <div>
          <div className="font-medium text-foreground">Column definitions</div>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li><strong>Return</strong> — NAV change from window start to window end.</li>
            <li><strong>Ann.</strong> — that return scaled to a 12-month rate.</li>
            <li><strong>Alpha</strong> — return minus the benchmark's return over the same window.</li>
            <li><strong>Max DD</strong> — deepest peak-to-trough NAV fall inside the window.</li>
            <li><strong>Vol</strong> — annualised standard deviation of daily returns.</li>
            <li><strong>Up days</strong> — share of trading days with a positive NAV move.</li>
            <li><strong>Sharpe / Sortino / Treynor</strong> — excess return over the 6.5% risk-free rate per unit of total risk, downside risk and beta respectively (trailing 3Y).</li>
            <li><strong>Down-mkt</strong> — compounded fund return across only the days the benchmark fell.</li>
            <li><strong>Consist.</strong> — share of rolling 3-month windows in the last 3 years where the fund beat the benchmark; a steady manager scores high here.</li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-foreground">Universe rules</div>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Direct plan, Growth option only — no IDCW, ETF, index or fund-of-fund schemes.</li>
            <li>One scheme per fund house, so a single AMC cannot flood the leaderboard.</li>
            <li>The scheme's official AMFI category must match the category you selected.</li>
            <li>The fund needs NAV coverage for at least 80% of the window's trading days.</li>
          </ul>
        </div>
      </div>
    </details>
  );
}
