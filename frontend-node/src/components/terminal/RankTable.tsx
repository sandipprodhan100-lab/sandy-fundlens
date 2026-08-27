import { useState } from "react";
import { Lock } from "lucide-react";

import {
  SERIES_KEYS,
  fmtCrore,
  type FundResult,
  type SeriesPoint,
} from "@/lib/mf-catalog";

type Col = {
  key: string;
  label: string;
  value: (f: FundResult) => number | null;
  format: (v: number | null) => string;
  signed?: boolean;
  invert?: boolean;
  pro?: boolean;
};

const COLS: Col[] = [
  { key: "return", label: "Return", value: (f) => f.return, format: pct, signed: true },
  { key: "alpha", label: "Alpha", value: (f) => f.alpha, format: pct, signed: true },
  { key: "dd", label: "Max DD", value: (f) => f.maxDrawdown, format: pct1, invert: true },
  { key: "sharpe", label: "Sharpe", value: (f) => f.sharpe, format: ratio, pro: true },
  { key: "sortino", label: "Sortino", value: (f) => f.sortino, format: ratio, pro: true },
  { key: "treynor", label: "Treynor", value: (f) => f.treynor, format: ratio, pro: true },
];

function pct(v: number | null) {
  return v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function pct1(v: number | null) {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}
function ratio(v: number | null) {
  return v === null ? "—" : v.toFixed(2);
}

/** Sparkline of the fund's rebased NAV across the analysed window. */
function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 120;
      const y = 26 - ((v - lo) / (hi - lo || 1)) * 24;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const up = points[points.length - 1]! >= points[0]!;
  return (
    <svg viewBox="0 0 120 28" className="h-7 w-[120px]" aria-hidden>
      <path
        d={d}
        fill="none"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
        stroke={up ? "var(--color-positive)" : "var(--color-negative)"}
      />
    </svg>
  );
}

/**
 * Top-N ranked table. Every figure carries an inline heat bar so relative
 * strength reads at a glance; Pro-only columns are blurred, not hidden.
 */
export function RankTable({
  funds,
  series,
  locked,
  onFocusFund,
}: {
  funds: FundResult[];
  series: SeriesPoint[];
  locked: boolean;
  onFocusFund: (f: { code: number; name: string }) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const ranges = new Map<string, { min: number; max: number }>();
  for (const c of COLS) {
    const vals = funds.map((f) => c.value(f)).filter((v): v is number => v !== null);
    ranges.set(c.key, { min: Math.min(...vals, 0), max: Math.max(...vals, 0) });
  }

  return (
    <div className="crossfade overflow-x-auto">
      <table className="data-table min-w-[820px]">
        <thead>
          <tr>
            <th className="cell-name w-10">#</th>
            <th className="cell-name">Fund</th>
            {COLS.map((c) => (
              <th key={c.key} className="pl-4 text-right">
                <span className="inline-flex items-center gap-1">
                  {c.pro && locked && <Lock className="size-3" />}
                  {c.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {funds.map((f, i) => {
            const spark = series
              .map((p) => p[SERIES_KEYS[i] as (typeof SERIES_KEYS)[number]])
              .filter((v): v is number => typeof v === "number");
            return (
              <tr
                key={f.code}
                onMouseEnter={() => setHover(f.code)}
                onMouseLeave={() => setHover((h) => (h === f.code ? null : h))}
                className="transition-colors"
              >
                <td className="align-middle">
                  <span className="num grid size-6 place-items-center rounded border border-primary/25 bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                </td>
                <td className="cell-name max-w-[320px] align-middle">
                  <button
                    onClick={() => onFocusFund({ code: f.code, name: f.name })}
                    className="text-left leading-snug hover:text-primary"
                  >
                    {f.name}
                  </button>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="tag-pill num">{fmtCrore(f.aumCrore)}</span>
                    <span className="tag-pill capitalize">
                      {f.sizeBucket} · {f.styleBucket}
                    </span>
                    {hover === f.code && spark.length > 1 && <Spark points={spark} />}
                  </div>
                </td>

                {COLS.map((c) => {
                  const v = c.value(f);
                  const r = ranges.get(c.key)!;
                  const span = Math.max(Math.abs(r.min), Math.abs(r.max)) || 1;
                  const width = v === null ? 0 : (Math.abs(v) / span) * 100;
                  const good = c.invert ? (v ?? 0) <= 0 : (v ?? 0) >= 0;
                  const blur = c.pro && locked;
                  return (
                    <td key={c.key} className="py-2.5 pl-4 align-middle text-right">
                      <span className="relative inline-flex h-6 min-w-[74px] items-center justify-end rounded px-1.5">
                        <span
                          className="heat"
                          style={{
                            width: `${width}%`,
                            background: good ? "var(--color-positive)" : "var(--color-negative)",
                          }}
                        />
                        <span
                          className={`num relative text-[13px] ${
                            c.signed || c.invert
                              ? good
                                ? "text-positive"
                                : "text-negative"
                              : "text-foreground"
                          } ${blur ? "blur-[5px] select-none" : ""}`}
                        >
                          {blur ? "0.00" : c.format(v)}
                        </span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
