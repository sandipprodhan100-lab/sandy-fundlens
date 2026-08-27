import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Lock, TrendingUp } from "lucide-react";

import { analyseSipPlan } from "@/lib/analysis-extras.functions";
import type { FundResult, IndexKey } from "@/lib/mf-catalog";
import { prettyDate } from "@/lib/mf-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const pct = (v: number | null) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`);

export function SipCalculator({
  funds,
  indexKey,
  start,
  end,
  locked,
  onUnlock,
}: {
  funds: Pick<FundResult, "code" | "name">[];
  indexKey: IndexKey;
  start: string;
  end: string;
  locked: boolean;
  onUnlock?: React.ReactNode;
}) {
  const [code, setCode] = useState<number | null>(funds[0]?.code ?? null);
  const [mode, setMode] = useState<"sip" | "lumpsum">("sip");
  // free-text amount so any value can be typed; parsed when the query runs
  const [amountText, setAmountText] = useState("10000");
  const amount = Math.max(0, Number(amountText.replace(/[^\d.]/g, "")) || 0);

  const activeCode = code ?? funds[0]?.code ?? null;

  const query = useQuery({
    queryKey: ["sip", activeCode, indexKey, start, end, mode, amount],
    enabled: !!activeCode,
    staleTime: 1000 * 60 * 30,
    queryFn: () =>
      analyseSipPlan({
        data: { code: activeCode!, indexKey, start, end, mode, amount },
      }),
  });

  const data = query.data;
  const scenarios = useMemo(() => data?.scenarios ?? [], [data]);

  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="size-4 text-primary" /> SIP &amp; lumpsum outcome
          </h3>
          <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
            What an investor actually earned in this fund between{" "}
            {prettyDate(start)} and {prettyDate(end)}, computed from NAV history — not an assumed
            return rate.
          </p>
        </div>
        <div className="flex gap-2">
          {(["sip", "lumpsum"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "secondary"}
              onClick={() => {
                setMode(m);
                setAmountText(m === "sip" ? "10000" : "100000");
              }}
            >
              {m === "sip" ? "Monthly SIP" : "Lumpsum"}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            {mode === "sip" ? "Monthly amount" : "One-time amount"}
          </label>
          <Input
            type="text"
            inputMode="decimal"
            className="num mt-1 w-40"
            placeholder={mode === "sip" ? "e.g. 7500" : "e.g. 125000"}
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>
        <div className="min-w-[16rem] flex-1">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Fund</label>
          <select
            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm"
            value={activeCode ?? ""}
            onChange={(e) => setCode(Number(e.target.value))}
          >
            {funds.map((f, i) => (
              <option key={f.code} value={f.code}>
                #{i + 1} · {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isPending ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Replaying NAV history…
        </div>
      ) : query.isError ? (
        <p className="mt-5 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : data ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Invested", v: inr(data.window.invested) },
              { k: "Value at window end", v: inr(data.window.value) },
              { k: "Gain", v: `${data.window.gain >= 0 ? "+" : "−"}${inr(Math.abs(data.window.gain))}` },
              { k: "XIRR", v: pct(data.window.xirr) },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="eyebrow">{s.k}</p>
                <p className="num mt-1 font-display text-lg font-semibold">{s.v}</p>
              </div>
            ))}
          </div>

          {data.benchmark && (
            <p className="num mt-3 text-xs text-muted-foreground">
              Same plan in the {data.indexLabel} proxy: {inr(data.benchmark.value)} · XIRR{" "}
              {pct(data.benchmark.xirr)}
            </p>
          )}

          {locked ? (
            <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4 text-primary" /> Rolling returns and post-sideways
                projections
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pro replays every window of the same length over five years, plus what this plan
                returned 1, 2 and 3 years after past flat phases ended.
              </p>
              {onUnlock}
            </div>
          ) : (
            <>
              {data.rolling && data.rolling.samples > 0 && (
                <div className="mt-6">
                  <h4 className="eyebrow">
                    Rolling {Math.round(data.rolling.lengthDays / 30)}-month windows · last 5 years
                  </h4>
                  <div className="num mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span>Median XIRR {pct(data.rolling.medianXirr)}</span>
                    <span className="text-positive">Best {pct(data.rolling.bestXirr)}</span>
                    <span className="text-negative">Worst {pct(data.rolling.worstXirr)}</span>
                    <span className="text-muted-foreground">
                      {data.rolling.positiveShare?.toFixed(0)}% of windows positive ·{" "}
                      {data.rolling.samples} samples
                    </span>
                  </div>
                </div>
              )}

              {scenarios.some((s) => s.samples > 0) && (
                <div className="mt-6 overflow-x-auto">
                  <h4 className="eyebrow">If the flat phase continues — or breaks</h4>
                  <table className="mt-2 w-full min-w-[560px] text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="pb-2 font-medium">Scenario</th>
                        <th className="pb-2 text-right font-medium">Median XIRR</th>
                        <th className="pb-2 text-right font-medium">Best</th>
                        <th className="pb-2 text-right font-medium">Worst</th>
                        <th className="pb-2 text-right font-medium">Positive</th>
                        <th className="pb-2 text-right font-medium">Phases</th>
                      </tr>
                    </thead>
                    <tbody className="num">
                      {scenarios.map((s) => (
                        <tr key={s.key} className="border-t border-border/70">
                          <td className="py-2 font-medium">{s.label}</td>
                          <td className="py-2 text-right">{pct(s.medianXirr)}</td>
                          <td className="py-2 text-right text-positive">{pct(s.bestXirr)}</td>
                          <td className="py-2 text-right text-negative">{pct(s.worstXirr)}</td>
                          <td className="py-2 text-right">
                            {s.positiveShare == null ? "—" : `${s.positiveShare.toFixed(0)}%`}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">{s.samples}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Each row keeps the same plan running from the start of a past flat phase and
                    measures it at the phase end, then 1, 2 and 3 years later.
                  </p>
                </div>
              )}
              {data.note && <p className="mt-3 text-xs text-muted-foreground">{data.note}</p>}
            </>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Past performance is not indicative of future results. Mutual fund investments are subject
            to market risks; read all scheme related documents carefully.
          </p>
        </>
      ) : null}
    </section>
  );
}
