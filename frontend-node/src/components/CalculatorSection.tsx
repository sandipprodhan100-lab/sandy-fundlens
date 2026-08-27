import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator, Coins, Layers, Loader2, Lock, PiggyBank } from "lucide-react";

import { analyseCategorySipPlan } from "@/lib/analysis-extras.functions";
import type { CategoryKey, IndexKey } from "@/lib/mf-catalog";
import { prettyDate } from "@/lib/mf-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const pct = (v: number | null | undefined) =>
  v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

const MODES = [
  { key: "sip", label: "SIP", icon: PiggyBank, hint: "A fixed amount invested every month" },
  { key: "lumpsum", label: "Lumpsum", icon: Coins, hint: "One cheque at the start of the window" },
  {
    key: "both",
    label: "SIP + Lumpsum",
    icon: Layers,
    hint: "Upfront amount plus a monthly top-up",
  },
] as const;

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

export function CalculatorSection({
  category,
  categoryLabel,
  indexKey,
  start,
  end,
  onUnlock,
}: {
  category: CategoryKey;
  categoryLabel: string;
  indexKey: IndexKey;
  start: string;
  end: string;
  onUnlock?: React.ReactNode;
}) {
  const [mode, setMode] = useState<"sip" | "lumpsum" | "both">("sip");
  const [basis, setBasis] = useState<"ranked" | "all">("ranked");
  // free-text amounts: the user types whatever they want, we parse on use
  const [monthly, setMonthly] = useState("10000");
  const [lumpsum, setLumpsum] = useState("100000");

  const [period, setPeriod] = useState<"sideways" | "inception" | "custom">("sideways");
  const [customStart, setCustomStart] = useState(start);
  const [customEnd, setCustomEnd] = useState(end);

  const todayIso = new Date().toISOString().slice(0, 10);
  const range =
    period === "sideways"
      ? { start, end }
      : period === "inception"
        ? { start: "2000-01-01", end: todayIso }
        : { start: customStart, end: customEnd };

  const monthlyNum = Math.max(0, Number(monthly.replace(/[^\d.]/g, "")) || 0);
  const lumpsumNum = Math.max(0, Number(lumpsum.replace(/[^\d.]/g, "")) || 0);
  const amount = mode === "lumpsum" ? lumpsumNum : monthlyNum;
  const upfront = mode === "both" ? lumpsumNum : 0;


  const validRange = range.start < range.end;
  // The server validator requires 100 <= amount <= 1cr, so hold the request
  // while the user is still typing an out-of-range figure.
  const validAmount = amount >= 100 && amount <= 10_000_000 && upfront <= 100_000_000;

  const query = useQuery({
    queryKey: [
      "categorySip",
      category,
      indexKey,
      range.start,
      range.end,
      mode,
      amount,
      upfront,
      basis,
    ],
    staleTime: 1000 * 60 * 30,
    enabled: validRange && validAmount,

    queryFn: () =>
      analyseCategorySipPlan({
        data: {
          category,
          indexKey,
          start: range.start,
          end: range.end,
          mode,
          amount,
          lumpsum: upfront,
          basis,
        },
      }),
  });


  const data = query.data;
  const chartRows = useMemo(
    () =>
      (data?.rows ?? [])
        .filter((r) => r.xirr != null)
        .slice(0, 12)
        .map((r) => ({
          label: r.rank ? `#${r.rank} ${r.house}` : r.house,
          name: r.name,
          xirr: Number((r.xirr ?? 0).toFixed(2)),
          value: r.value,
          invested: r.invested,
          gain: r.gain,
        })),
    [data],
  );

  const leader = data?.rows[0];
  const split = leader
    ? [
        { name: "Invested", value: Math.max(leader.invested, 0) },
        { name: "Gain", value: Math.max(leader.gain, 0) },
      ]
    : [];

  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Calculator className="size-4 text-primary" /> {categoryLabel} return calculator
          </h3>
          <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
            Every rupee is replayed against actual NAV history between {prettyDate(range.start)} and{" "}
            {prettyDate(range.end)} — no assumed rate of return. Compare a monthly SIP, a one-time
            lumpsum, or both together across the whole category or just the ranked winners.
          </p>

        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          {MODES.map((m) => (
            <Button
              key={m.key}
              size="sm"
              variant={mode === m.key ? "default" : "secondary"}
              onClick={() => setMode(m.key)}
            >
              <m.icon className="size-4" /> {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <div className="min-w-0">
          <label className="eyebrow">Return period</label>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(
              [
                { k: "sideways", l: "Sideways window" },
                { k: "inception", l: "Since inception" },
                { k: "custom", l: "Custom dates" },
              ] as const
            ).map((p) => (
              <Button
                key={p.k}
                size="sm"
                variant={period === p.k ? "default" : "secondary"}
                onClick={() => setPeriod(p.k)}
              >
                {p.l}
              </Button>
            ))}
          </div>
        </div>
        {period === "custom" && (
          <>
            <div>
              <label className="eyebrow">From</label>
              <Input
                type="date"
                className="num mt-1 w-full sm:w-40"
                value={customStart}
                max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <label className="eyebrow">To</label>
              <Input
                type="date"
                className="num mt-1 w-full sm:w-40"
                value={customEnd}
                min={customStart}
                max={todayIso}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">

        {(mode === "sip" || mode === "both") && (
          <div>
            <label className="eyebrow">Monthly SIP (₹)</label>
            <Input
              type="text"
              inputMode="decimal"
              className="num mt-1 w-full sm:w-40"
              placeholder="e.g. 7500"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </div>
        )}
        {(mode === "lumpsum" || mode === "both") && (
          <div>
            <label className="eyebrow">Upfront lumpsum (₹)</label>
            <Input
              type="text"
              inputMode="decimal"
              className="num mt-1 w-full sm:w-40"
              placeholder="e.g. 125000"
              value={lumpsum}
              onChange={(e) => setLumpsum(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex">
          {(["ranked", "all"] as const).map((b) => (
            <Button
              key={b}
              size="sm"
              variant={basis === b ? "default" : "secondary"}
              onClick={() => setBasis(b)}
            >
              {b === "ranked" ? "Ranked top 5" : "All funds in category"}
            </Button>
          ))}
        </div>
      </div>
      {!validAmount && (
        <p className="num mt-2 text-xs text-sideways">
          Enter an amount between ₹100 and ₹1,00,00,000 to run the calculation.
        </p>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        {MODES.find((m) => m.key === mode)!.hint}
      </p>

      {!validRange ? (
        <p className="mt-6 text-sm text-destructive">Pick an end date after the start date.</p>
      ) : query.isPending ? (

        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Replaying NAV history for every
          fund…
        </div>
      ) : query.isError ? (
        <p className="mt-6 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : data ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { k: "Funds replayed", v: String(data.summary.funds) },
              { k: "Invested per fund", v: inr(data.summary.invested) },
              { k: "Median XIRR", v: pct(data.summary.medianXirr) },
              {
                k: `Beat ${data.indexLabel}`,
                v: `${data.summary.beatBenchmark} / ${data.summary.funds}`,
              },
            ].map((s) => (
              <div key={s.k} className="stat-tile">
                <p className="eyebrow">{s.k}</p>
                <p className="num mt-1 font-display text-lg font-semibold">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h4 className="eyebrow">XIRR by fund · money-weighted</h4>
              <div className="mt-3 h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
                    <XAxis
                      dataKey="label"
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      width={44}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
                      formatter={(v: number, _k, p) => [
                        `${v}% XIRR · ${inr((p?.payload as { value: number }).value)}`,
                        (p?.payload as { name: string }).name,
                      ]}
                    />
                    {data.benchmark?.xirr != null && (
                      <ReferenceLine
                        y={Number(data.benchmark.xirr.toFixed(2))}
                        stroke="var(--color-sideways)"
                        strokeDasharray="5 5"
                        label={{
                          value: `${data.indexLabel} ${pct(data.benchmark.xirr)}`,
                          position: "insideTopRight",
                          fontSize: 10,
                          fill: "var(--color-muted-foreground)",
                        }}
                      />
                    )}
                    <Bar dataKey="xirr" radius={[6, 6, 0, 0]}>
                      {chartRows.map((r, i) => (
                        <Cell
                          key={r.name}
                          fill={r.xirr >= 0 ? PALETTE[i % PALETTE.length] : "var(--color-negative)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="eyebrow">Invested vs gain · {leader?.house ?? "top fund"}</h4>
              <div className="mt-3 h-64 w-full sm:h-72">
                {split.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={split}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={3}
                        stroke="none"
                      >
                        <Cell fill="var(--color-chart-5)" />
                        <Cell fill="var(--color-chart-1)" />
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {leader && (
                <p className="num mt-1 text-center text-xs text-muted-foreground">
                  {inr(leader.value)} final value · {pct(leader.xirr)} XIRR
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Fund</th>
                  <th className="pb-2 text-right font-medium">Rank</th>
                  <th className="pb-2 text-right font-medium">Invested</th>
                  <th className="pb-2 text-right font-medium">Value</th>
                  <th className="pb-2 text-right font-medium">Gain</th>
                  <th className="pb-2 text-right font-medium">Abs.</th>
                  <th className="pb-2 text-right font-medium">XIRR</th>
                </tr>
              </thead>
              <tbody className="num">
                {data.rows.map((r) => (
                  <tr key={r.code} className="border-t border-border/70">
                    <td className="max-w-[280px] py-2 font-sans leading-snug">{r.name}</td>
                    <td className="py-2 text-right text-muted-foreground">{r.rank ?? "—"}</td>
                    <td className="py-2 text-right">{inr(r.invested)}</td>
                    <td className="py-2 text-right">{inr(r.value)}</td>
                    <td
                      className={`py-2 text-right ${r.gain >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {inr(r.gain)}
                    </td>
                    <td className="py-2 text-right">{pct(r.absReturn)}</td>
                    <td className="py-2 text-right font-semibold">{pct(r.xirr)}</td>
                  </tr>
                ))}
                {data.benchmark && (
                  <tr className="border-t border-border bg-muted/40">
                    <td className="py-2 font-sans font-medium">{data.indexLabel} (benchmark)</td>
                    <td className="py-2" />
                    <td className="py-2 text-right">{inr(data.benchmark.invested)}</td>
                    <td className="py-2 text-right">{inr(data.benchmark.value)}</td>
                    <td className="py-2 text-right">{inr(data.benchmark.gain)}</td>
                    <td className="py-2 text-right">{pct(data.benchmark.absReturn)}</td>
                    <td className="py-2 text-right font-semibold">{pct(data.benchmark.xirr)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data.locked && (
            <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4 text-primary" /> Category-wide comparison
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Free shows the top three ranked funds. Pro replays every screened fund in the
                category so you can see the full spread of outcomes.
              </p>
              {onUnlock}
            </div>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Illustrative only. Past performance is not indicative of future results. Mutual fund
            investments are subject to market risks; read all scheme related documents carefully.
          </p>
        </>
      ) : null}
    </section>
  );
}
