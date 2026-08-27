import { useMemo } from "react";

import { prettyDate, type SidewaysWindow } from "@/lib/mf-catalog";

type Point = { date: string; value: number };

/**
 * The pitch chart: the real benchmark NAV series drawn as a thin line with the
 * detected sideways phases shaded amber. Pure SVG so the line can draw itself in
 * on load without a chart library re-render.
 */
export function HeroChart({
  series,
  windows,
  activeStart,
  indexLabel,
  loading,
  height = 260,
}: {
  series: Point[];
  windows: Pick<SidewaysWindow, "start" | "end">[];
  activeStart?: string | undefined;
  indexLabel: string;
  loading?: boolean;
  height?: number;
}) {
  const W = 1000;
  const H = height;

  const model = useMemo(() => {
    if (series.length < 2) return null;
    const xs = series.map((p) => Date.parse(p.date));
    const ys = series.map((p) => p.value);
    const x0 = xs[0]!;
    const x1 = xs[xs.length - 1]!;
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const pad = (hi - lo) * 0.12 || 1;
    const sx = (t: number) => ((t - x0) / Math.max(1, x1 - x0)) * W;
    const sy = (v: number) => H - ((v - (lo - pad)) / (hi - lo + pad * 2)) * H;
    const d = series.map((p, i) => `${i ? "L" : "M"}${sx(Date.parse(p.date)).toFixed(1)} ${sy(p.value).toFixed(1)}`).join(" ");
    const bands = windows.map((w) => {
      const a = sx(Date.parse(w.start));
      const b = sx(Date.parse(w.end));
      return { key: w.start, x: a, w: Math.max(2, b - a), active: w.start === activeStart };
    });
    return { d, bands, first: series[0]!, last: series[series.length - 1]! };
  }, [series, windows, activeStart, H]);

  if (loading || !model) {
    return <div className="shimmer w-full rounded-lg" style={{ height: H }} />;
  }

  const change =
    ((model.last.value - model.first.value) / model.first.value) * 100;

  return (
    <figure className="crossfade relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: H }}
        role="img"
        aria-label={`${indexLabel} NAV history with detected sideways phases`}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={H * f}
            y2={H * f}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        ))}
        {model.bands.map((b) => (
          <g key={b.key}>
            <rect
              x={b.x}
              y={0}
              width={b.w}
              height={H}
              fill="var(--color-sideways)"
              opacity={b.active ? 0.2 : 0.1}
            />
            <rect x={b.x} y={0} width={1} height={H} fill="var(--color-sideways)" opacity={0.5} />
          </g>
        ))}
        <path
          d={model.d}
          fill="none"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="draw-line"
          style={{ ["--dash" as string]: 4000 }}
        />

      </svg>

      <figcaption className="num mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          {indexLabel} · {prettyDate(model.first.date)} → {prettyDate(model.last.date)}
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-[2px] bg-sideways/40" /> sideways phase
          </span>
          <span className={change >= 0 ? "text-positive" : "text-negative"}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}% total
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function LivePill({ label = "AMFI NAV · synced today 06:00 IST" }: { label?: string }) {
  return (
    <span className="num inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-positive opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
      </span>
      {label}
    </span>
  );
}

