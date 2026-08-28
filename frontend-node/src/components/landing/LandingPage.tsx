import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Lock,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";

import { analyseFunds, getSidewaysWindows } from "@/lib/mf.functions";
import {
  CATEGORIES,
  INDEXES,
  TOP_N,
  fmtPct,
  prettyDate,
  type CategoryKey,
  type IndexKey,
} from "@/lib/mf-catalog";
import { RankTable } from "@/components/terminal/RankTable";
import { SkeletonRows } from "@/components/terminal/LockedPreview";
import { FundChartPanel } from "@/components/FundChartPanel";
import { PortfolioConsultationForm } from "@/components/PortfolioConsultationForm";

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function StepLabel({ n, children }: { n: number; children: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="num grid size-[18px] place-items-center rounded-[5px] text-[11px] font-bold text-[var(--accent)]"
        style={{ background: "var(--accent-soft)" }}
      >
        {n}
      </span>
      <span className="eyebrow">{children}</span>
    </div>
  );
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span
        className="grid size-[30px] place-items-center rounded-[7px] text-[var(--accent)]"
        style={{ background: "var(--accent-soft)" }}
      >
        <Search className="size-4" />
      </span>
      <span className="font-display text-[15.5px] font-semibold text-[var(--ink)]">
        MF Lens
      </span>
    </Link>
  );
}

const NAV_LINKS = [
  { label: "Analysis", to: "/analysis" },
  { label: "Analyst", to: "/analyst" },
  { label: "Methodology", to: "/methodology" },
  { label: "Pricing", to: "/pricing" },
] as const;

const FEATURE_ITEMS = [
  {
    icon: BarChart3,
    title: "Sideways phases detected",
    body: "Flat windows are found in the benchmark itself — a ±3% band held for at least three months with no sustained breakout.",
  },
  {
    icon: Scale,
    title: "Risk beside return",
    body: "Alpha, maximum drawdown and volatility are reported together, so outperformance is never read without its cost.",
  },
  {
    icon: Building2,
    title: "Holdings and managers",
    body: "Top holdings, sector mix and manager tenure come from fund-house disclosures, not from marketing material.",
  },
  {
    icon: ShieldCheck,
    title: "Independent by design",
    body: "No distribution, no commissions, no sponsored placements. Every scheme in a category is scored the same way.",
  },
];

const FAIR_TEST = [
  {
    title: "The index picks the window",
    body: "Sideways phases are detected from benchmark data before any fund is scored, so no period is cherry-picked to make a fund look good.",
  },
  {
    title: "Every fund, not a shortlist",
    body: "All funds in a category are ranked in every window; nothing is filtered out for underperforming and nobody pays to appear.",
  },
  {
    title: "Risk sits beside return",
    body: "Alpha earned with an 18% drawdown is not the same as alpha earned with 4%, so both numbers are always shown together.",
  },
];

const FAQS = [
  {
    q: "Is this investment advice?",
    a: "No. MF Lens is an analytics tool only. We hold no SEBI registration as an investment adviser or research analyst, and nothing here is a recommendation to buy, hold or sell any scheme.",
  },
  {
    q: 'What counts as a "sideways" window?',
    a: "A stretch where the benchmark stays inside a ±3% band for at least three months with no sustained breakout above or below that band.",
  },
  {
    q: "Where does the data come from?",
    a: "AMFI daily NAVs, refreshed at 09:00 IST each business day. Benchmarks are tracked through index proxy funds, so the comparison is post-expense.",
  },
  {
    q: "What does the AI analyst do?",
    a: "It explains what the numbers show in plain language. It describes results — it never recommends a scheme.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, any time from the account page. Access continues until the end of the paid period.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const [category, setCategory] = useState<CategoryKey>("flexi");
  const [indexKey, setIndexKey] = useState<IndexKey>("nifty500");
  const [submitted, setSubmitted] = useState<{ start: string; end: string } | null>(null);
  const [focusFund, setFocusFund] = useState<{ code: number; name: string } | null>(null);

  const sideways = useQuery({
    queryKey: ["sideways", indexKey],
    queryFn: () => getSidewaysWindows({ data: { indexKey } }),
    staleTime: 1000 * 60 * 30,
  });

  const analysis = useQuery({
    queryKey: ["analysis", category, indexKey, submitted?.start, submitted?.end],
    enabled: !!submitted,
    queryFn: () =>
      analyseFunds({ data: { category, indexKey, start: submitted!.start, end: submitted!.end } }),
    staleTime: 1000 * 60 * 30,
  });

  const windows = useMemo(() => sideways.data?.windows ?? [], [sideways.data]);

  useEffect(() => {
    const w = windows[0];
    if (w && !submitted) setSubmitted({ start: w.start, end: w.end });
  }, [windows, submitted]);

  useEffect(() => {
    setFocusFund(null);
  }, [category, indexKey, submitted?.start]);

  const catDef = CATEGORIES.find((c) => c.key === category)!;
  const indexDef = INDEXES.find((i) => i.key === indexKey)!;
  const top = analysis.data?.funds.slice(0, TOP_N) ?? [];
  const chartFund = focusFund ?? (top[0] ? { code: top[0].code, name: top[0].name } : null);

  const stamp = sideways.data?.last ? prettyDate(sideways.data.last) : "—";

  function pickCategory(key: CategoryKey) {
    setCategory(key);
    const def = CATEGORIES.find((c) => c.key === key)!;
    setIndexKey(def.defaultIndex);
    setSubmitted(null);
  }

  return (
    <>
      {/* 1 — NAV -------------------------------------------------- */}
      <header
        className="sticky top-0 z-40 h-[62px] border-b"
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Wordmark />
          <nav className="flex items-center gap-6 text-[14px] text-[var(--ink-2)]">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-[var(--ink)]">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* 2 — HERO ------------------------------------------------ */}
        <section
          className="px-5 pb-10 pt-[66px] sm:px-8"
          style={{
            background:
              "radial-gradient(760px 320px at 50% -10%, var(--bg-tint), transparent 70%)",
          }}
        >
          <div className="mx-auto max-w-4xl text-center">
            <span className="num inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] text-[var(--ink-2)]"
              style={{ borderColor: "var(--border-strong)" }}>
              <span className="relative flex size-1.5">
                <span
                  className="absolute inline-flex size-1.5 animate-ping rounded-full opacity-75"
                  style={{ background: "var(--live)" }}
                />
                <span
                  className="relative inline-flex size-1.5 rounded-full"
                  style={{ background: "var(--live)" }}
                />
              </span>
              Live AMFI NAVs · updated {stamp}, 09:00 IST
            </span>

            <h1 className="mt-5 text-[clamp(32px,5vw,50px)] font-[760] leading-[1.08] tracking-[-0.03em] text-[var(--ink)]">
              Which funds actually deliver when the index goes{" "}
              <span className="text-[var(--accent)]">sideways</span>?
            </h1>

            <p className="mx-auto mt-4 max-w-[40em] text-[16px] leading-[1.65] text-[var(--ink-2)]">
              Bull markets flatter everyone. MF Lens finds the stretches where a benchmark went
              nowhere for months, then ranks every fund in the category on what it actually
              earned — and what it risked — over exactly that window.
            </p>

            <p className="num mt-5 text-[12.6px] text-[var(--ink-3)]">
              {analysis.data ? analysis.data.analysed : "—"} equity funds · {windows.length}{" "}
              sideways windows detected · 20 years of daily NAV history
            </p>
          </div>
        </section>

        {/* 3 — THE TOOL -------------------------------------------- */}
        <section className="px-5 pb-14 sm:px-8">
          <div
            className="mx-auto w-full max-w-6xl overflow-hidden rounded-[14px] border bg-[var(--bg)]"
            style={{ borderColor: "var(--border)" }}
          >
            {/* selectors */}
            <div className="grid gap-6 p-5 md:grid-cols-3 md:gap-0 md:divide-x md:[&>*]:px-6 md:[&>*:first-child]:pl-0 md:[&>*:last-child]:pr-0"
              style={{ borderColor: "var(--border)" }}>
              <div>
                <StepLabel n={1}>Category</StepLabel>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={c.key === category}
                      onClick={() => pickCategory(c.key)}
                      className="chip"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <StepLabel n={2}>Benchmark index</StepLabel>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {INDEXES.map((i) => (
                    <button
                      key={i.key}
                      type="button"
                      aria-pressed={i.key === indexKey}
                      onClick={() => {
                        setIndexKey(i.key);
                        setSubmitted(null);
                      }}
                      className="chip"
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
                <p className="num mt-3 text-[11px] text-[var(--ink-3)]">
                  Compared via index proxy fund, post-expense
                </p>
              </div>

              <div>
                <StepLabel n={3}>Sideways phase</StepLabel>
                <div className="mt-3 grid gap-1.5">
                  {sideways.isPending &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <span key={i} className="shimmer h-9 w-full rounded-lg" />
                    ))}
                  {windows.map((w: any) => (
                    <button
                      key={w.start}
                      type="button"
                      aria-pressed={w.start === submitted?.start}
                      onClick={() => setSubmitted({ start: w.start, end: w.end })}
                      className="phase-row"
                    >
                      <span className="text-[13px]">
                        {prettyDate(w.start)} → {prettyDate(w.end)}
                      </span>
                      <span className="num text-[12px] text-[var(--ink-3)]">{w.days}d</span>
                    </button>
                  ))}
                  {sideways.data && windows.length === 0 && (
                    <p className="text-[13px] text-[var(--ink-3)]">
                      No qualifying flat phase in this index's history.
                    </p>
                  )}
                </div>
                <p className="num mt-3 text-[11px] text-[var(--ink-3)]">
                  QUALIFIES: ±3% BAND · ≥3 MONTHS · NO BREAKOUT
                </p>
              </div>
            </div>

            {/* results header bar */}
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-y px-5 py-2.5"
              style={{ background: "var(--bg-alt)", borderColor: "var(--border)" }}
            >
              <span className="text-[13.5px] font-[560] text-[var(--ink)]">
                {catDef.label} ·{" "}
                {analysis.data ? `${analysis.data.analysed} funds ranked by alpha` : "loading…"}
              </span>
              <span className="num text-[11.5px] uppercase text-[var(--ink-3)]">
                {indexDef.label}
                {analysis.data
                  ? ` · ${prettyDate(analysis.data.start)} – ${prettyDate(analysis.data.end)} · index ${fmtPct(analysis.data.indexReturn)}`
                  : ""}
              </span>
            </div>

            {/* results split */}
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div>
                {analysis.isPending || analysis.isFetching ? (
                  <SkeletonRows rows={6} />
                ) : analysis.isError ? (
                  <p className="text-[13.5px] text-[var(--neg)]">
                    {(analysis.error as Error).message}
                  </p>
                ) : (
                  <RankTable
                    funds={top}
                    series={analysis.data?.series ?? []}
                    onFocusFund={setFocusFund}
                  />
                )}

                {/* Clean direct link to full interactive terminal */}
                <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 p-3.5 shadow-sm">
                  <span className="text-xs font-medium text-foreground">
                    Access all funds, 3Y rolling windows & model portfolios:
                  </span>
                  <Link
                    to="/analysis"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Open Analysis →
                  </Link>
                </div>
              </div>

              <div>
                {chartFund && analysis.data ? (
                  <FundChartPanel
                    code={chartFund.code}
                    name={chartFund.name}
                    indexKey={indexKey}
                    start={analysis.data.start}
                    end={analysis.data.end}
                    onClose={() => setFocusFund(null)}
                  />
                ) : (
                  <SkeletonRows rows={6} />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4 — FEATURES -------------------------------------------- */}
        <section
          className="border-y px-5 py-16 sm:px-8"
          style={{ background: "var(--bg-alt)", borderColor: "var(--border)" }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-[29px] font-[730] tracking-[-0.02em] text-[var(--ink)]">
                Built for the market nobody analyses
              </h2>
              <p className="mx-auto mt-2 max-w-[40em] text-[15.5px] text-[var(--ink-2)]">
                Star ratings score whole years. Flat markets are where fund selection actually
                separates, and that is the only thing measured here.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURE_ITEMS.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <span
                    className="grid size-[34px] place-items-center rounded-[9px]"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    <Icon className="size-4 text-[var(--accent)]" strokeWidth={2} />
                  </span>
                  <h3 className="mt-3 text-[15.5px] font-bold text-[var(--ink)]">{title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-[var(--ink-2)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 — A FAIR TEST ----------------------------------------- */}
        <section className="px-5 py-16 sm:px-8" style={{ background: "var(--bg)" }}>
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-[29px] font-[730] tracking-[-0.02em] text-[var(--ink)]">
              A fair test
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {FAIR_TEST.map((p, i) => (
                <div key={p.title}>
                  <span
                    className="num grid size-[28px] place-items-center rounded-[8px] text-[13px] font-bold text-[var(--accent)]"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-3 text-[15.5px] font-bold text-[var(--ink)]">{p.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-[var(--ink-2)]">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 — FAQ -------------------------------------------------- */}
        <section
          className="border-y px-5 py-16 sm:px-8"
          style={{ background: "var(--bg-alt)", borderColor: "var(--border)" }}
        >
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-center text-[29px] font-[730] tracking-[-0.02em] text-[var(--ink)]">
              Questions, answered
            </h2>
            <div className="mt-8">
              {FAQS.map((f, i) => (
                <details
                  key={f.q}
                  open={i === 0}
                  className="faq-row border-t last:border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15.5px] font-[600] text-[var(--ink)]">
                    {f.q}
                    <span className="num text-[18px] text-[var(--ink-3)]">
                      <span className="faq-plus">+</span>
                      <span className="faq-minus">–</span>
                    </span>
                  </summary>
                  <p className="pb-4 text-[14.5px] leading-[1.65] text-[var(--ink-2)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Sharpe / Sortino / Treynor Audit Section */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          <PortfolioConsultationForm />
        </section>

        {/* 7 — CTA BAND -------------------------------------------- */}
        <section className="px-5 py-16 sm:px-8" style={{ background: "var(--accent)" }}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-[29px] font-[730] tracking-[-0.02em] text-white">
              See how your funds handled flat markets
            </h2>
            <p className="mx-auto mt-2 max-w-[36em] text-[15.5px] text-white/75">
              Real NAV data, every category — free, nothing to install.
            </p>
            <Link
              to="/analysis"
              className="mt-6 inline-flex items-center rounded-[8px] bg-white px-[22px] py-3 text-[15.5px] font-semibold text-[var(--accent)] hover:bg-white/90"
            >
              Start analysing
            </Link>
          </div>
        </section>
      </main>

      {/* 8 — FOOTER ------------------------------------------------ */}
      <footer
        className="border-t px-5 py-12 sm:px-8"
        style={{ background: "var(--bg-alt)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-[28em] text-[13.5px] leading-[1.6] text-[var(--ink-2)]">
              Independent quantitative analytics on Indian mutual funds, focused on how schemes
              behave when their benchmark goes flat.
            </p>
          </div>
          {[
            {
              head: "Product",
              links: [
                { to: "/analysis", label: "Analysis" },
                { to: "/analyst", label: "AI analyst" },
                { to: "/pricing", label: "Pricing" },
              ],
            },
            {
              head: "Learn",
              links: [
                { to: "/methodology", label: "Methodology" },
                { to: "/analysis", label: "Sideways windows" },
              ],
            },
            {
              head: "Company",
              links: [
                { to: "/terms", label: "Terms" },
                { to: "/privacy", label: "Privacy" },
              ],
            },
          ].map((col) => (
            <div key={col.head}>
              <p className="eyebrow">{col.head}</p>
              <ul className="mt-3 grid gap-2 text-[13.5px] text-[var(--ink-2)]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="hover:text-[var(--ink)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {col.head === "Company" && (
                  <li>
                    <a
                      href="mailto:support@mutualfundlens.app"
                      className="hover:text-[var(--ink)]"
                    >
                      Support &amp; grievances
                    </a>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Catchy, eye-catching disclaimer banner in footer */}
        <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-300">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Disclaimer &amp; Risk Warning
            </span>
            <span className="text-xs">SEBI Statutory Notice</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-950/90 dark:text-amber-200/90">
            MF Lens is an analytics tool and is not an investment adviser. We hold no SEBI registration
            as an investment adviser, research analyst or distributor. Nothing on this site is investment
            advice or a recommendation to buy, hold or sell any scheme. Past performance during sideways
            windows does not guarantee future results. Mutual fund investments are subject to market
            risks — read all scheme related documents carefully. NAV data sourced from AMFI.
          </p>
          <p className="num mt-2 text-[11px] font-medium text-amber-900/75 dark:text-amber-300/75">
            © {new Date().getFullYear()} MF Lens · Independent Mutual Fund Quantitative Research
          </p>
        </div>
      </footer>
    </>
  );
}
