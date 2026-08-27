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

import { fmtCrore, type FundResult } from "@/lib/mf-catalog";

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

/** Scoreboard visuals for the ranked funds: alpha bars, AUM mix and score gauges. */
export function RankVisuals({
  funds,
  indexLabel,
  onFocusFund,
}: {
  funds: FundResult[];
  indexLabel: string;
  onFocusFund?: (fund: { code: number; name: string }) => void;
}) {
  const rows = useMemo(
    () =>
      funds.slice(0, 5).map((f, i) => ({
        code: f.code,
        name: f.name,
        label: `#${i + 1} ${f.house}`,
        alpha: Number(f.alpha.toFixed(2)),
        ret: Number(f.return.toFixed(2)),
        drawdown: Number(Math.abs(f.maxDrawdown).toFixed(2)),
        score: Number(f.score.toFixed(2)),
        aum: f.aumCrore ?? 0,
        fill: PALETTE[i % PALETTE.length]!,
      })),
    [funds],
  );

  if (rows.length === 0) return null;

  const aumRows = rows.filter((r) => r.aum > 0);
  const maxScore = Math.max(...rows.map((r) => r.score), 1);

  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <BarChart3 className="size-4 text-primary" /> Rank scoreboard
      </h3>
      <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
        The same ranked table, read visually: how much each winner beat {indexLabel} by, how deep it
        fell along the way, how the category's money is split between them, and the composite score
        that drives the ranking.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="eyebrow">Alpha vs drawdown</h4>
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
                  formatter={(v: number, k) => [
                    `${v}%`,
                    k === "alpha" ? "Alpha vs index" : "Max drawdown",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="alpha"
                  name="Alpha"
                  fill="var(--color-chart-1)"
                  radius={[6, 6, 0, 0]}
                  onClick={(d: { payload?: { code: number; name: string } }) =>
                    d?.payload && onFocusFund?.({ code: d.payload.code, name: d.payload.name })
                  }
                />
                <Bar
                  dataKey="drawdown"
                  name="Max drawdown"
                  fill="var(--color-chart-2)"
                  radius={[6, 6, 0, 0]}
                />
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

        <div className="lg:col-span-2">
          <h4 className="eyebrow">Composite rank score</h4>
          <div className="mt-3 h-56 w-full">
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
