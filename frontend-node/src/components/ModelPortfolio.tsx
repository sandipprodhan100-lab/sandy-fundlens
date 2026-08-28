import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, Lock, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

import { getModelPortfolio } from "@/lib/analysis-extras.functions";
import { MODEL_DISCLAIMER, MODELS, type RiskProfile } from "@/lib/portfolio-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

const CATEGORY_COLORS: Record<string, string> = {
  large: "#2f7d76", // deep teal
  flexi: "#3f6fb0", // blue
  multi: "#8a6bbd", // violet
  mid: "#c98a2b", // amber
  small: "#c05a5a", // rose
  hybrid: "#6f8f4a", // olive
};
const FALLBACK_COLORS = ["#2f7d76", "#3f6fb0", "#8a6bbd", "#c98a2b", "#c05a5a", "#6f8f4a"];
const sleeveColor = (category: string, i: number) =>
  CATEGORY_COLORS[category] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]!;

type PlanMode = "sip" | "lumpsum" | "both";

const PLAN_MODES: { key: PlanMode; label: string }[] = [
  { key: "sip", label: "SIP" },
  { key: "lumpsum", label: "Lumpsum" },
  { key: "both", label: "SIP + Lumpsum" },
];

const parseAmount = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0);

export function ModelPortfolio({ onUnlock }: { onUnlock?: React.ReactNode }) {
  const [profile, setProfile] = useState<RiskProfile>("balanced");
  const [mode, setMode] = useState<PlanMode>("sip");
  const [monthly, setMonthly] = useState("25000");
  const [lumpsum, setLumpsum] = useState("500000");

  const monthlyNum = parseAmount(monthly);
  const lumpsumNum = parseAmount(lumpsum);
  const showSip = mode === "sip" || mode === "both";
  const showLumpsum = mode === "lumpsum" || mode === "both";

  const monthlyForQuery = showSip ? monthlyNum : 500;
  const validMonthly = monthlyForQuery >= 500 && monthlyForQuery <= 10_000_000;
  const validLumpsum = !showLumpsum || (lumpsumNum >= 500 && lumpsumNum <= 100_000_000);

  const query = useQuery({
    queryKey: ["model-portfolio", profile, monthlyForQuery],
    staleTime: 1000 * 60 * 30,
    enabled: validMonthly,
    queryFn: () => getModelPortfolio({ data: { profile, monthly: monthlyForQuery } }),
  });

  const data = query.data;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2">
            <Briefcase className="size-3.5" /> Quantitative Allocation Engine
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Model Mutual Fund Portfolio
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs text-slate-600 leading-relaxed">
            Market-cap-weighted core with category satellite ceilings, liquidity protection, and risk-managed downside buffers.
          </p>
        </div>

        {/* Risk Profile Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => setProfile(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                profile === m.key
                  ? "bg-white text-slate-950 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Mode & Inputs */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
            {PLAN_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  mode === m.key
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {showSip && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">SIP:</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-32 rounded-lg border border-slate-300 bg-white pl-6 pr-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                  placeholder="25000"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                />
              </div>
            </div>
          )}

          {showLumpsum && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Lumpsum:</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-36 rounded-lg border border-slate-300 bg-white pl-6 pr-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                  placeholder="500000"
                  value={lumpsum}
                  onChange={(e) => setLumpsum(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {data && (
          <div className="text-xs font-medium text-slate-500">
            <span className="font-bold text-slate-900">{data.horizon}</span> horizon ·{" "}
            <span className="font-bold text-slate-900">{data.equityPct}%</span> equity ·{" "}
            <span className="font-bold text-slate-900">{100 - data.equityPct}%</span> debt-bearing
          </div>
        )}
      </div>

      {(!validMonthly || !validLumpsum) && (
        <p className="mt-3 text-xs font-medium text-amber-600">
          Enter an amount of ₹500 or more to build the allocation split.
        </p>
      )}

      {query.isPending ? (
        <div className="mt-8 flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin text-slate-900" /> Building quantitative sleeve mix…
        </div>
      ) : query.isError ? (
        <p className="mt-5 text-sm text-red-600">{(query.error as Error).message}</p>
      ) : data ? (
        <div className="mt-6 space-y-6">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            {data.summary}
          </p>

          {/* Allocation Progress Bar */}
          <div className="space-y-2">
            <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-slate-200 shadow-inner">
              {data.sleeves.map((s, i) => (
                <div
                  key={s.category}
                  title={`${s.categoryLabel} ${s.weight}%`}
                  style={{
                    width: `${s.weight}%`,
                    background: sleeveColor(s.category, i),
                  }}
                  className="transition-all"
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-600">
              {data.sleeves.map((s, i) => (
                <span key={s.category} className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ background: sleeveColor(s.category, i) }}
                  />
                  <span>{s.categoryLabel}</span>
                  <span className="font-bold text-slate-900">{s.weight}%</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── DESKTOP TABLE VIEW (hidden on small mobile) ── */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Sleeve</th>
                  <th className="py-3.5 px-4 text-center">Weight</th>
                  {showSip && <th className="py-3.5 px-4 text-right">Monthly SIP</th>}
                  {showLumpsum && <th className="py-3.5 px-4 text-right">Lumpsum</th>}
                  <th className="py-3.5 px-5">Role &amp; Standard</th>
                  <th className="py-3.5 px-5">Fund Pick</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.sleeves.map((s, i) => (
                  <tr key={s.category} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: sleeveColor(s.category, i) }}
                        />
                        {s.categoryLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {s.weight}%
                      </span>
                    </td>

                    {showSip && (
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-700 font-mono whitespace-nowrap">
                        {inr((monthlyNum * s.weight) / 100)}
                      </td>
                    )}

                    {showLumpsum && (
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono whitespace-nowrap">
                        {inr((lumpsumNum * s.weight) / 100)}
                      </td>
                    )}

                    <td className="py-3.5 px-5 max-w-xs">
                      <div className="font-bold text-slate-900">{s.role}</div>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{s.standard}</p>
                    </td>

                    <td className="py-3.5 px-5 max-w-sm">
                      {data.locked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Lock className="size-3" /> Pro
                        </span>
                      ) : s.primary ? (
                        <div>
                          <div className="font-bold text-slate-900">{s.primary.name}</div>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Alpha {s.primary.alpha >= 0 ? "+" : ""}
                            {s.primary.alpha.toFixed(2)}% in flat phase
                            {s.primary.cagr3y != null && ` · 3Y ${s.primary.cagr3y.toFixed(1)}%`}
                          </p>
                          {s.alternate && (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Alternate: {s.alternate.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{s.note ?? "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARD VIEW (visible on small screens) ── */}
          <div className="md:hidden space-y-3">
            {data.sleeves.map((s, i) => (
              <div
                key={s.category}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="inline-flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: sleeveColor(s.category, i) }}
                    />
                    {s.categoryLabel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-900">
                    {s.weight}% Weight
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {showSip && (
                    <div className="bg-indigo-50/60 border border-indigo-100 p-2 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block">Monthly SIP</span>
                      <span className="font-mono font-bold text-indigo-900 text-sm">
                        {inr((monthlyNum * s.weight) / 100)}
                      </span>
                    </div>
                  )}
                  {showLumpsum && (
                    <div className="bg-emerald-50/60 border border-emerald-100 p-2 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Lumpsum</span>
                      <span className="font-mono font-bold text-emerald-900 text-sm">
                        {inr((lumpsumNum * s.weight) / 100)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">{s.role}</span>
                  <p className="text-slate-500 leading-relaxed">{s.standard}</p>
                </div>

                {s.primary && (
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Top Quantitative Pick</span>
                    <span className="font-bold text-slate-900">{s.primary.name}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Alpha {s.primary.alpha >= 0 ? "+" : ""}{s.primary.alpha.toFixed(2)}% in flat phase
                      {s.primary.cagr3y != null && ` · 3Y ${s.primary.cagr3y.toFixed(1)}%`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <p>{data.rebalance}</p>
            {data.blendedAlpha != null && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                <TrendingUp className="size-3.5" />
                <span>Weighted Flat Phase Alpha: {data.blendedAlpha >= 0 ? "+" : ""}{data.blendedAlpha.toFixed(2)}%</span>
              </div>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400">
            {MODEL_DISCLAIMER}
          </p>
        </div>
      ) : null}
    </section>
  );
}
