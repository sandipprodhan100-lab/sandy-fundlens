import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, Lock } from "lucide-react";

import { getModelPortfolio } from "@/lib/analysis-extras.functions";
import { MODEL_DISCLAIMER, MODELS, type RiskProfile } from "@/lib/portfolio-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

/**
 * One fixed, clearly separable hue per fund category so the allocation bar,
 * the legend and the table all read the same way.
 */
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
  // free-text amounts: the user types whatever they want, parsed on use
  const [monthly, setMonthly] = useState("25000");
  const [lumpsum, setLumpsum] = useState("500000");

  const monthlyNum = parseAmount(monthly);
  const lumpsumNum = parseAmount(lumpsum);
  const showSip = mode === "sip" || mode === "both";
  const showLumpsum = mode === "lumpsum" || mode === "both";

  // The allocation weights don't depend on the amount, so a lumpsum-only plan
  // still asks the server with a neutral monthly figure.
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
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <Briefcase className="size-4 text-primary" /> Model MF portfolio
          </h2>
          <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
            Allocation weights follow mainstream global and emerging-market practice: a
            market-cap-weighted core, satellites capped per category, mid + small held inside the
            usual EM liquidity limits, and a debt-bearing sleeve sized to the horizon.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODELS.map((m) => (
            <Button
              key={m.key}
              size="sm"
              variant={profile === m.key ? "default" : "secondary"}
              onClick={() => setProfile(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap gap-2">
          {PLAN_MODES.map((m) => (
            <Button
              key={m.key}
              size="sm"
              variant={mode === m.key ? "default" : "secondary"}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        {showSip && (
          <div>
            <label className="eyebrow">Monthly SIP (₹)</label>
            <Input
              type="text"
              inputMode="decimal"
              className="num mt-1 w-full sm:w-40"
              placeholder="e.g. 25000"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </div>
        )}
        {showLumpsum && (
          <div>
            <label className="eyebrow">Lumpsum (₹)</label>
            <Input
              type="text"
              inputMode="decimal"
              className="num mt-1 w-full sm:w-40"
              placeholder="e.g. 500000"
              value={lumpsum}
              onChange={(e) => setLumpsum(e.target.value)}
            />
          </div>
        )}

        {data && (
          <p className="text-xs text-muted-foreground">
            {data.horizon} horizon · {data.equityPct}% equity ·{" "}
            {100 - data.equityPct}% debt-bearing
          </p>
        )}
      </div>

      {(!validMonthly || !validLumpsum) && (
        <p className="num mt-2 text-xs text-sideways">
          Enter an amount of ₹500 or more to build the sleeve split.
        </p>
      )}


      {query.isPending ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Building the sleeve mix…
        </div>
      ) : query.isError ? (
        <p className="mt-5 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : data ? (
        <>
          <p className="mt-4 text-sm">{data.summary}</p>

          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full border border-border">
            {data.sleeves.map((s, i) => (
              <div
                key={s.category}
                title={`${s.categoryLabel} ${s.weight}%`}
                style={{
                  width: `${s.weight}%`,
                  background: sleeveColor(s.category, i),
                }}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {data.sleeves.map((s, i) => (
              <span key={s.category} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: sleeveColor(s.category, i) }}
                />
                {s.categoryLabel} <span className="num">{s.weight}%</span>
              </span>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-sm">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                {showSip && <col className="w-[12%]" />}
                {showLumpsum && <col className="w-[12%]" />}
                <col className="w-[28%]" />
                <col />
              </colgroup>
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Sleeve</th>
                  <th className="pb-2 text-right font-medium">Weight</th>
                  {showSip && <th className="pb-2 text-right font-medium">Monthly SIP</th>}
                  {showLumpsum && <th className="pb-2 text-right font-medium">Lumpsum</th>}
                  <th className="pb-2 font-medium">Role &amp; standard</th>
                  <th className="pb-2 font-medium">Fund pick</th>
                </tr>
              </thead>
              <tbody>
                {data.sleeves.map((s, i) => (
                  <tr key={s.category} className="border-t border-border/70 align-top">
                    <td className="py-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: sleeveColor(s.category, i) }}
                        />
                        {s.categoryLabel}
                      </span>
                    </td>

                    <td className="num py-3 text-right font-semibold">{s.weight}%</td>
                    {showSip && (
                      <td className="num py-3 text-right text-muted-foreground">
                        {inr((monthlyNum * s.weight) / 100)}
                      </td>
                    )}
                    {showLumpsum && (
                      <td className="num py-3 text-right text-muted-foreground">
                        {inr((lumpsumNum * s.weight) / 100)}
                      </td>
                    )}

                    <td className="py-3 pr-5">
                      <span className="font-medium">{s.role}</span>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{s.standard}</p>
                    </td>
                    <td className="py-3 break-words">
                      {data.locked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="size-3" /> Pro
                        </span>
                      ) : s.primary ? (
                        <>
                          <span className="font-medium">{s.primary.name}</span>
                          <p className="num mt-1 text-xs text-muted-foreground">
                            Alpha {s.primary.alpha >= 0 ? "+" : ""}
                            {s.primary.alpha.toFixed(2)}% in the latest flat phase
                            {s.primary.cagr3y != null && ` · 3Y ${s.primary.cagr3y.toFixed(1)}%`}
                          </p>
                          {s.alternate && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Alternate: {s.alternate.name}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{s.note ?? "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">{data.rebalance}</p>

          {data.locked ? (
            <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4 text-primary" /> Fund picks for every sleeve
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Free shows the target allocation. Pro fills each sleeve with the current top ranked
                fund from that category's latest sideways window, plus an alternate.
              </p>
              {onUnlock}
            </div>
          ) : (
            data.blendedAlpha != null && (
              <p className="num mt-3 text-sm">
                Weighted alpha of the picked funds during their flat phases:{" "}
                <span className="font-semibold">
                  {data.blendedAlpha >= 0 ? "+" : ""}
                  {data.blendedAlpha.toFixed(2)}%
                </span>
              </p>
            )
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {MODEL_DISCLAIMER}
          </p>
        </>
      ) : null}
    </section>
  );
}
