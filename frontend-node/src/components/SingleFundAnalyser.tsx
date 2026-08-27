import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { FundRatings } from "@/components/FundRatings";
import { FundChartPanel } from "@/components/FundChartPanel";
import { Input } from "@/components/ui/input";
import { fmtPct, type FundResult, type IndexKey } from "@/lib/mf-catalog";

/**
 * Free, always-unlocked module: pick any single screened fund in the current
 * category and read its window performance plus its NAV curve against the
 * benchmark. No Pro gating — this is the entry point for demo visitors.
 */
export function SingleFundAnalyser({
  funds,
  indexKey,
  indexLabel,
  start,
  end,
}: {
  funds: FundResult[];
  indexKey: IndexKey;
  indexLabel: string;
  start: string;
  end: string;
}) {
  const [query, setQuery] = useState("");
  const [code, setCode] = useState<number | null>(funds[0]?.code ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? funds.filter((f) => f.name.toLowerCase().includes(q)) : funds;
    return list.slice(0, 200);
  }, [funds, query]);

  const selected = funds.find((f) => f.code === code) ?? filtered[0] ?? funds[0] ?? null;

  if (!selected) return null;

  const stats: { label: string; value: string }[] = [
    { label: "Window return", value: fmtPct(selected.return) },
    { label: `Alpha vs ${indexLabel}`, value: fmtPct(selected.alpha) },
    { label: "Max drawdown", value: fmtPct(selected.maxDrawdown) },
    { label: "Volatility (ann.)", value: fmtPct(selected.volatility) },
    { label: "CAGR 1Y", value: selected.cagr1y == null ? "—" : fmtPct(selected.cagr1y) },
    { label: "CAGR 3Y", value: selected.cagr3y == null ? "—" : fmtPct(selected.cagr3y) },
    { label: "CAGR 5Y", value: selected.cagr5y == null ? "—" : fmtPct(selected.cagr5y) },
    {
      label: "Fund size",
      value: selected.aumCrore == null ? "—" : `₹${Math.round(selected.aumCrore).toLocaleString("en-IN")} cr`,
    },
  ];

  return (
    <section className="panel mt-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="eyebrow">Analyse one fund · free</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search any screened fund in this category and read it against {indexLabel}.
          </p>
        </div>
        <span className="num text-[11px] text-muted-foreground">{funds.length} funds screened</span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search fund name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="num h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          value={selected.code}
          onChange={(e) => setCode(Number(e.target.value))}
        >
          {filtered.map((f) => (
            <option key={f.code} value={f.code}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-border/60 bg-card/40 p-3">
            <p className="eyebrow">{s.label}</p>
            <p className="num mt-1 text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <FundRatings fundName={selected.name} />
      </div>

      <FundChartPanel
        code={selected.code}
        name={selected.name}
        indexKey={indexKey}
        start={start}
        end={end}
        onClose={() => setQuery("")}
      />
    </section>
  );
}
