import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import { fmtCrore, type CombinedFund } from "@/lib/mf-catalog";

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

/**
 * Scoreboard visuals for the combined ranking: average alpha per phase,
 * fund-size mix and the blended score that decides the order.
 */
export function CombinedVisuals({
  funds,
  indexLabel,
  phases,
  onFocusFund,
}: {
  funds: CombinedFund[];
  indexLabel: string;
  phases: number;
  onFocusFund?: (fund: { code: number; name: string }) => void;
}) {
  const rows = useMemo(
    () =>
      funds.slice(0, 5).map((f, i) => ({
        code: f.code,
        name: f.name,
        label: `#${i + 1} ${f.house}`,
        avgAlpha: Number(f.avgAlpha.toFixed(2)),
        bestAlpha: Number(Math.max(...f.windows.map((w) => w.alpha), 0).toFixed(2)),
        worstAlpha: Number(Math.min(...f.windows.map((w) => w.alpha), 0).toFixed(2)),
        score: Number(f.combinedScore.toFixed(2)),
        aum: f.aumCrore ?? 0,
        fill: PALETTE[i % PALETTE.length]!,
      })),
    [funds],
  );

  const perPhase = useMemo(() => {
    const top = funds.slice(0, 5);
    const stamps = Array.from(new Set(top.flatMap((f) => f.windows.map((w) => w.start)))).sort();
    return stamps.map((start) => {
      const row: Record<string, string | number> = { phase: start.slice(0, 7) };
      top.forEach((f, i) => {
        const hit = f.windows.find((w) => w.start === start);
        row[`f${i}`] = hit ? Number(hit.alpha.toFixed(2)) : 0;
      });
      return row;
    });
  }, [funds]);

  if (rows.length === 0) return null;

  const aumRows = rows.filter((r) => r.aum > 0);
  const maxScore = Math.max(...rows.map((r) => r.score), 1);

  return (
    <section className="panel p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <BarChart3 className="size-4 text-primary" /> Combined scoreboard
      </h3>
      <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
        The blended table read visually: average and range of alpha versus {indexLabel} across the
        last {phases} flat phases, phase-by-phase alpha, how the category's money sits between the
        winners, and the combined score that drives the order.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="eyebrow">Average alpha · best and worst phase</h4>
          <div className="mt-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 30, left: 0 }}>
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  width={42}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
                  formatter={(v: number) => `${v}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="avgAlpha"
                  name="Average alpha"
                  fill="var(--color-chart-1)"
                  radius={[6, 6, 0, 0]}
                  onClick={(d: { payload?: { code: number; name: string } }) =>
                    d?.payload && onFocusFund?.({ code: d.payload.code, name: d.payload.name })
                  }
                />
                <Bar
                  dataKey="bestAlpha"
                  name="Best phase"
                  fill="var(--color-chart-3)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="worstAlpha"
                  name="Worst phase"
                  fill="var(--color-chart-2)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="eyebrow">Alpha by sideways phase</h4>
          <div className="mt-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perPhase} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis
                  dataKey="phase"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  width={42}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
                  formatter={(v: number) => `${v}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {rows.map((r, i) => (
                  <Bar
                    key={r.code}
                    dataKey={`f${i}`}
                    name={r.label}
                    fill={r.fill}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="eyebrow">Fund size mix across the top 5</h4>
          <div className="mt-3 h-64 w-full">
            {aumRows.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aumRows}
                    dataKey="aum"
                    nameKey="label"
                    innerRadius="52%"
                    outerRadius="80%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {aumRows.map((r) => (
                      <Cell key={r.code} fill={r.fill} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCrore(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <h4 className="eyebrow">Combined score</h4>
          <div className="mt-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={rows}
                innerRadius="25%"
                outerRadius="100%"
                startAngle={200}
                endAngle={-20}
              >
                <PolarAngleAxis type="number" domain={[0, maxScore]} tick={false} />
                <RadialBar dataKey="score" background cornerRadius={8}>
                  {rows.map((r) => (
                    <Cell key={r.code} fill={r.fill} />
                  ))}
                </RadialBar>
                <Legend
                  iconSize={8}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: 11 }}
                  payload={rows.map((r) => ({
                    value: `${r.label} · ${r.score}`,
                    type: "square",
                    id: String(r.code),
                    color: r.fill,
                  }))}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(2)} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
