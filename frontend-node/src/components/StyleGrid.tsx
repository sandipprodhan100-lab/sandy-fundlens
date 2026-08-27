import { SIZE_ROWS, STYLE_COLS, TOP_N, type FundResult } from "@/lib/mf-catalog";

export function StyleGrid({ funds }: { funds: FundResult[] }) {
  const top3 = new Set(funds.slice(0, TOP_N).map((f) => f.code));

  return (
    <div className="panel mt-6 p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Style grid · size × investing style
      </h2>
      <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
        Size comes from the official AMFI category; multi-cap and flexi-cap funds are placed by the size
        index their daily NAV returns track most closely. Style is derived from three years of NAV
        behaviour — an approximation, not an official style box.
      </p>

      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-[110px_repeat(3,minmax(0,1fr))] gap-2">
          <div />
          {STYLE_COLS.map((c) => (
            <div key={c.key} className="text-center" title={c.hint}>
              <div className="text-sm font-semibold">{c.label}</div>
              <div className="text-[11px] leading-snug text-muted-foreground">{c.hint}</div>
            </div>
          ))}

          {SIZE_ROWS.map((r) => (
            <div key={r.key} className="contents">
              <div className="flex items-center text-sm font-semibold">{r.label}</div>
              {STYLE_COLS.map((c) => {
                const cell = funds.filter((f) => f.sizeBucket === r.key && f.styleBucket === c.key);
                return (
                  <div
                    key={c.key}
                    title={c.hint}
                    className="min-h-24 rounded-xl border border-border bg-surface p-3"
                  >
                    {cell.length === 0 ? (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    ) : (
                      <ul className="space-y-1.5">
                        {cell.map((f) => (
                          <li key={f.code} className="text-xs leading-snug">
                            <span
                              className={
                                top3.has(f.code) ? "font-semibold text-primary" : "text-foreground/80"
                              }
                            >
                              {f.house}
                            </span>
                            <span className="num ml-1 text-muted-foreground">
                              β {f.beta.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
