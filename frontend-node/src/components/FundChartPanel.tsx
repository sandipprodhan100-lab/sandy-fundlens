import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getFundVsIndex } from "@/lib/mf.functions";
import { fmtPct, prettyDate, type IndexKey } from "@/lib/mf-catalog";
import { Button } from "@/components/ui/button";

/** Direct value label drawn at the final point of a series. */
function EndLabel(props: {
  x?: string | number | undefined;
  y?: string | number | undefined;
  value?: string | number | undefined;
  index?: number | undefined;
  color: string;
  last: number;
}) {
  const { x, y, value, index, color, last } = props;
  if (index !== last || x === undefined || y === undefined) return null;
  const cx = Number(x);
  const cy = Number(y);
  return (
    <g>
      <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="#fff" strokeWidth={2} />
      <text x={cx + 8} y={cy + 3.5} fill={color} fontSize={10.5} fontFamily="var(--font-mono)">
        {Number(value).toFixed(1)}
      </text>
    </g>
  );
}

export function FundChartPanel({
  code,
  name,
  indexKey,
  start,
  end,
  onClose,
}: {
  code: number;
  name: string;
  indexKey: IndexKey;
  start: string;
  end: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["fund-vs-index", code, indexKey, start, end],
    queryFn: () => getFundVsIndex({ data: { code, indexKey, start, end } }),
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="panel mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Fund vs benchmark
          </h2>
          <p className="mt-1 text-base font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">
            {prettyDate(start)} → {prettyDate(end)} · rebased to 100
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={onClose}>
          <X className="size-4" /> Close
        </Button>
      </div>

      {query.isPending && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin text-primary" /> Loading NAV series…
        </div>
      )}
      {query.isError && (
        <p className="mt-4 text-xs text-destructive">{(query.error as Error).message}</p>
      )}

      {query.data && (() => {
        const last = query.data.points.length - 1;
        return (
        <>
          <div className="num mt-4 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Fund</div>
              <div
                className={
                  query.data.fundReturn >= 0 ? "text-positive text-lg" : "text-negative text-lg"
                }
              >
                {fmtPct(query.data.fundReturn)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {query.data.indexLabel}
              </div>
              <div className="text-lg text-muted-foreground">{fmtPct(query.data.indexReturn)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Alpha</div>
              <div
                className={
                  query.data.fundReturn - query.data.indexReturn >= 0
                    ? "text-positive text-lg"
                    : "text-negative text-lg"
                }
              >
                {fmtPct(query.data.fundReturn - query.data.indexReturn)}
              </div>
            </div>
          </div>

          <div className="chart-legend mt-4">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ background: "var(--series-1)" }}
              />
              {name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ background: "var(--series-2)" }}
              />
              {query.data.indexLabel}
            </span>
          </div>

          <div className="mt-2 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={query.data.points}
                margin={{ top: 12, right: 56, bottom: 0, left: 0 }}
              >
                <CartesianGrid stroke="var(--grid)" strokeWidth={1} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 10.5,
                    fill: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                  }}
                  tickFormatter={(d: string) => d.slice(5)}
                  minTickGap={40}
                  stroke="var(--baseline)"
                />
                <YAxis
                  tick={{
                    fontSize: 10.5,
                    fill: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                  }}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tickFormatter={(v: number) => v.toFixed(0)}
                  width={44}
                  stroke="var(--baseline)"
                />
                <ReferenceLine y={100} stroke="var(--baseline)" strokeWidth={1} />
                <Tooltip
                  cursor={{ stroke: "var(--crosshair)", strokeWidth: 1 }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="chart-tip">
                        <div className="mb-1 text-[11px] text-muted-foreground">
                          {prettyDate(String(label))}
                        </div>
                        {payload.map((p) => (
                          <div key={String(p.dataKey)} className="flex items-center gap-2">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ background: String(p.color) }}
                            />
                            <span>
                              {p.dataKey === "fund" ? "Fund" : query.data!.indexLabel}
                            </span>
                            <span className="ml-auto">{Number(p.value).toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="fund"
                  stroke="none"
                  fill="var(--chart-wash)"
                  isAnimationActive={false}
                  legendType="none"
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="index"
                  stroke="var(--series-2)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{ r: 3.5, stroke: "#fff", strokeWidth: 2 }}
                >
                  <LabelList
                    dataKey="index"
                    position="right"
                    content={(p: any) => <EndLabel x={p.x} y={p.y} value={p.value} index={p.index} color="var(--series-2)" last={last} />}
                  />
                </Line>
                <Line
                  type="monotone"
                  dataKey="fund"
                  stroke="var(--series-1)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{ r: 3.5, stroke: "#fff", strokeWidth: 2 }}
                >
                  <LabelList
                    dataKey="fund"
                    position="right"
                    content={(p: any) => <EndLabel x={p.x} y={p.y} value={p.value} index={p.index} color="var(--series-1)" last={last} />}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </>
        );
      })()}
    </div>
  );
}
