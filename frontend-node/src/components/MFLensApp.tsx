import { Link } from "@tanstack/react-router";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowRight, ChevronDown, Download, Lock } from "lucide-react";

import { useSession } from "@/lib/auth";
import { DEMO_WINDOW_LIMIT, FEATURES, isLogicLocked, isOpenEdition } from "@/lib/app-edition";
import { hasProAccess } from "@/lib/purchases.functions";
import { usePaddleCheckout } from "@/lib/paddle";
import { analyseFunds, getSidewaysWindows } from "@/lib/mf.functions";
import {
  CATEGORIES,
  INDEXES,
  SIDEWAYS_RULE,
  SERIES_KEYS,
  TOP_N,
  fmtPct,
  prettyDate,
  type CategoryKey,
  type FundProfile,
  type HoldingsResult,
  type IndexKey,
} from "@/lib/mf-catalog";
import { downloadReport } from "@/lib/report-pdf";
import { CategorySizePanel } from "@/components/CategorySizePanel";
import { Leaderboard } from "@/components/Leaderboard";
import { StyleGrid } from "@/components/StyleGrid";
import { RankingMethodology, SidewaysMethodology, WindowReason } from "@/components/Methodology";
import { RatioGuide } from "@/components/RatioGuide";
import { FundChartPanel } from "@/components/FundChartPanel";
import { UpgradeCta } from "@/components/UpgradeCta";
import { SipCalculator } from "@/components/SipCalculator";
import { SingleFundAnalyser } from "@/components/SingleFundAnalyser";
import { RankCard } from "@/components/RankCard";
import { RankVisuals } from "@/components/RankVisuals";
import { SectorDrift } from "@/components/SectorDrift";
import { OverlapPanel } from "@/components/OverlapPanel";

// Mode-scoped modules are heavy (charts + tables) and only one is on screen at
// a time, so they are fetched on demand instead of shipping in the first load.
const CombinedRanking = lazy(() =>
  import("@/components/CombinedRanking").then((m) => ({ default: m.CombinedRanking })),
);
const DipRadar = lazy(() => import("@/components/DipRadar").then((m) => ({ default: m.DipRadar })));
const CalculatorSection = lazy(() =>
  import("@/components/CalculatorSection").then((m) => ({ default: m.CalculatorSection })),
);
const ModelPortfolio = lazy(() =>
  import("@/components/ModelPortfolio").then((m) => ({ default: m.ModelPortfolio })),
);
import { HeroChart, LivePill } from "@/components/terminal/HeroChart";
import { ControlBar } from "@/components/terminal/ControlBar";
import { ModuleMenu } from "@/components/terminal/ModuleMenu";

import { type ModeKey } from "@/components/terminal/ModeCards";
import { LockedPreview, SkeletonRows } from "@/components/terminal/LockedPreview";
import { RankTable } from "@/components/terminal/RankTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSettingsPanel } from "@/components/terminal/AdminSettingsPanel";

const ALL_ANALYSIS_VIEWS: { key: ModeKey; label: string; hint: string }[] = [
  { key: "single", label: "Single phase", hint: "One flat window or a custom range" },
  { key: "combined", label: "Combined · last 3", hint: "Blended across recent flat phases" },
  { key: "dips", label: "Dip radar", hint: "Ranked funds 5–10% off peak" },
  { key: "calc", label: "Calculators", hint: "SIP · lumpsum · both" },
  { key: "model", label: "Model portfolio", hint: "Standards-based allocation" },
];

const ANALYSIS_VIEWS = ALL_ANALYSIS_VIEWS.filter((v) =>
  v.key === "model" ? FEATURES.modelPortfolio : true,
);

const RANK_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
];


export function MFLensApp({ demo = false }: { demo?: boolean }) {
  const [category, setCategory] = useState<CategoryKey>("flexi");
  const [indexKey, setIndexKey] = useState<IndexKey>("nifty500");
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [submitted, setSubmitted] = useState<{ start: string; end: string } | null>(null);
  const [profiles, setProfiles] = useState<Record<number, FundProfile>>({});
  const [holdings, setHoldings] = useState<Record<number, HoldingsResult>>({});
  const [exporting, setExporting] = useState(false);
  const [focusFund, setFocusFund] = useState<{ code: number; name: string } | null>(null);
  const [view, setView] = useState<ModeKey>("single");
  const [showSize, setShowSize] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showSip, setShowSip] = useState(false);
  const [showOverlap, setShowOverlap] = useState(false);
  const [showDrift, setShowDrift] = useState(false);
  
  // Custom sideways windows parameters
  const [bandPct, setBandPct] = useState(3.0);
  const [minDays, setMinDays] = useState(90);
  const [maxDrift, setMaxDrift] = useState(5.0);
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  const { session } = useSession();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const { openCheckout } = usePaddleCheckout();

  const proQuery = useQuery({
    queryKey: ["proAccess", userId],
    queryFn: () => hasProAccess(),
    enabled: !demo && !!userId,
  });
  const isPro = !!proQuery.data;

  const sideways = useQuery({
    queryKey: ["sideways", indexKey, bandPct, minDays, maxDrift],
    queryFn: () => getSidewaysWindows({ data: { indexKey, bandPct, minDays, maxDrift } }),
    staleTime: 1000 * 60 * 30,
  });

  const analysis = useQuery({
    queryKey: ["analysis", category, indexKey, submitted?.start, submitted?.end],
    enabled: !!submitted,
    queryFn: () =>
      analyseFunds({ data: { category, indexKey, start: submitted!.start, end: submitted!.end } }),
    staleTime: 1000 * 60 * 30,
  });

  /* ------------------------------------------------------------------
   * Back / forward navigation.
   * Category, benchmark, module and the analysed window live in the URL so
   * the browser back button returns to the previous view instead of leaving
   * the page, and a view can be bookmarked or shared.
   * ---------------------------------------------------------------- */
  const readUrl = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    const cat = p.get("cat");
    const idx = p.get("idx");
    const mod = p.get("view");
    const from = p.get("from");
    const to = p.get("to");
    if (cat && CATEGORIES.some((c) => c.key === cat)) setCategory(cat as CategoryKey);
    if (idx && INDEXES.some((i) => i.key === idx)) setIndexKey(idx as IndexKey);
    if (mod && ANALYSIS_VIEWS.some((m) => m.key === mod)) setView(mod as ModeKey);
    if (from && to) {
      setRange({ start: from, end: to });
      setSubmitted({ start: from, end: to });
    }
  }, []);

  useEffect(() => {
    readUrl();
    const onPop = () => readUrl();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [readUrl]);

  const urlWritten = useRef(false);
  // Set when the default window is auto-selected, so it does not add history.
  const autoWindow = useRef(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set("cat", category);
    p.set("idx", indexKey);
    p.set("view", view);
    if (submitted) {
      p.set("from", submitted.start);
      p.set("to", submitted.end);
    } else {
      p.delete("from");
      p.delete("to");
    }
    const next = `${window.location.pathname}?${p.toString()}`;
    if (next === `${window.location.pathname}${window.location.search}`) return;
    // The first write only reconciles the URL with hydrated state, and the
    // auto-selected default window is not a user action either.
    if (!urlWritten.current || autoWindow.current) {
      urlWritten.current = true;
      autoWindow.current = false;
      window.history.replaceState(window.history.state, "", next);
      return;
    }
    window.history.pushState(window.history.state, "", next);
  }, [category, indexKey, view, submitted]);

  const windows = sideways.data?.windows ?? [];

  // Analysis is fully open — no login or paywall gating. Only the MF Lens
  // Analyst (/analyst) requires authentication.
  const limited = false;
  // Results are open in the demo edition; the methodology behind them is not.
  const logicLocked = isLogicLocked(limited);
  const shownWindows =
    limited && Number.isFinite(DEMO_WINDOW_LIMIT) ? windows.slice(0, DEMO_WINDOW_LIMIT) : windows;

  useEffect(() => {
    const w = windows[0];
    if (w && !submitted) {
      autoWindow.current = true;
      setSubmitted({ start: w.start, end: w.end });
    }
  }, [submitted, windows]);


  const [checkoutPending, setCheckoutPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    window.history.replaceState({}, "", window.location.pathname);
    setCheckoutPending(true);
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      void proQuery.refetch().then((r) => {
        if (r.data || tries >= 10) {
          window.clearInterval(timer);
          setCheckoutPending(false);
        }
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const indexDef = INDEXES.find((i) => i.key === indexKey)!;
  const catDef = CATEGORIES.find((c) => c.key === category)!;
  const top3 = analysis.data?.funds.slice(0, TOP_N) ?? [];

  const heroSeries = useMemo(() => sideways.data?.series ?? [], [sideways.data]);
  const activeWindow = useMemo(
    () => windows.find((w: any) => w.start === submitted?.start) ?? null,
    [windows, submitted],
  );

  function pickCategory(key: CategoryKey) {
    setCategory(key);
    const def = CATEGORIES.find((c) => c.key === key)!;
    setIndexKey(def.defaultIndex);
    setSubmitted(null);
    setFocusFund(null);
  }

  function run(start: string, end: string) {
    setRange({ start, end });
    setSubmitted({ start, end });
  }

  const cacheProfile = useCallback((code: number, profile: FundProfile) => {
    setProfiles((prev) => ({ ...prev, [code]: profile }));
  }, []);

  const cacheHoldings = useCallback((code: number, result: HoldingsResult) => {
    setHoldings((prev) => ({ ...prev, [code]: result }));
  }, []);

  const unlockAction = (
    <Link
      to="/analysis"
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
    >
      Unlock full view <ArrowRight className="size-3.5" />
    </Link>
  );

  const upgradeCta = <div className="mt-3">{unlockAction}</div>;

  async function exportPdf() {
    if (!analysis.data) return;
    setExporting(true);
    try {
      const { renderChartPng } = await import("@/lib/chart-png");
      const chart = renderChartPng(
        analysis.data,
        top3.map((f) => f.name),
      );
      await downloadReport({
        analysis: analysis.data,
        categoryLabel: catDef.label,
        chart,
        holdings,
        profiles,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="glass tech-beam sticky top-0 z-40">

        {!isOpenEdition && <PaymentTestModeBanner />}
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary/12 ring-1 ring-primary/25">
              <Activity className="size-3.5 text-primary" />
            </span>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.28em]">
              MF Lens
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <ModuleMenu mode={view} onMode={setView} modes={ANALYSIS_VIEWS} />
            {FEATURES.analyst && (
              <Link to="/analyst" className="text-foreground/70 hover:text-foreground">
                Analyst
              </Link>
            )}
            {FEATURES.pricing && (
              <Link to="/pricing" className="text-foreground/70 hover:text-foreground">
                Pricing
              </Link>
            )}
            {userId && (
              <Link to="/account" className="text-foreground/70 hover:text-foreground">
                Account
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-8">
        {/* Compliance notice — kept at the very top, always visible */}
        <div className="rounded-lg border-2 border-sideways/60 bg-sideways/10 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-sideways">
            For analysis only — this is NOT investment advice
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
            MF Lens is an independent quantitative research tool and is{" "}
            <strong>not a SEBI-registered investment adviser or distributor</strong>. Nothing shown
            here is a recommendation to buy, hold or sell any scheme.{" "}
            <strong>
              Mutual fund investments are subject to market risks — read all scheme related
              documents carefully.
            </strong>{" "}
            Past performance is not indicative of future returns.
          </p>
        </div>

        {/* Data freshness — sits directly under the disclaimer */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <LivePill />
          {sideways.data?.last && (
            <span className="num text-[11px] text-muted-foreground">
              NAV through {prettyDate(sideways.data.last)}
            </span>
          )}
        </div>


        {/* Control bar — sticky so analysis stays in view */}
        <div className="sticky top-12 z-30 mt-3">
          <ControlBar
            category={category}
            onCategory={pickCategory}
            indexKey={indexKey}
            onIndex={(k) => {
              setIndexKey(k);
              setSubmitted(null);
            }}
            indexLocked={limited}
            phase={activeWindow}
            loading={sideways.isPending}
            mode={view}
            modes={ANALYSIS_VIEWS}
            bandPct={bandPct}
            onBandPct={(v) => {
              setBandPct(v);
              setSubmitted(null);
            }}
            minDays={minDays}
            onMinDays={(v) => {
              setMinDays(v);
              setSubmitted(null);
            }}
            maxDrift={maxDrift}
            onMaxDrift={(v) => {
              setMaxDrift(v);
              setSubmitted(null);
            }}
            onOpenSettings={() => setShowAdminSettings(true)}
          />

        </div>

        {/* Hero: the chart is the pitch — collapsible so results stay above the fold */}
        <details className="panel mt-3 p-3 sm:p-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
            <span className="eyebrow">Benchmark chart</span>
            <span className="num text-[11px] text-muted-foreground">
              {indexDef.label} · {catDef.label} · benchmark chart & sideways bands
              <ChevronDown className="ml-1 inline size-3.5" />
            </span>
          </summary>

          <div className="mt-3">
            <HeroChart
              series={heroSeries}
              windows={shownWindows}
              activeStart={submitted?.start}
              indexLabel={indexDef.label}
              loading={sideways.isPending}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-0.5">
                Universe: direct plans · growth option · 1 scheme per AMC
              </span>
              <span className="num rounded-full border border-border px-2 py-0.5">
                Flat rule: {SIDEWAYS_RULE.minDays}d+ · drift ±{SIDEWAYS_RULE.maxDrift}% · band ≤
                {SIDEWAYS_RULE.maxBand}%
              </span>
              {sideways.data?.last && (
                <span className="num rounded-full border border-border px-2 py-0.5">
                  NAV through {prettyDate(sideways.data.last)}
                </span>
              )}
            </div>
          </div>
        </details>

        {checkoutPending && (
          <div className="num mt-3 rounded-md border border-primary/40 bg-primary/10 p-3 text-xs">
            Payment received — activating your Pro access…
          </div>
        )}
        {!isOpenEdition && !demo && !isPro && !checkoutPending && userId && (
          <div className="mt-3">
            <UpgradeCta userId={userId} customerEmail={userEmail} />
          </div>
        )}


        {view === "single" && (
          <>
            <section className="panel mt-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="eyebrow">Detected sideways phases</h2>
                <span className="num text-[11px] text-muted-foreground">
                  {windows.length} in {indexDef.label} history
                </span>
              </div>

              <div className="mt-3 grid gap-1.5">
                {sideways.isPending &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="shimmer h-9 w-full rounded-lg" />
                  ))}
                {shownWindows.map((w: any) => {
                  const on = w.start === submitted?.start;
                  return (
                    <button
                      key={w.start}
                      type="button"
                      aria-pressed={on}
                      onClick={() => run(w.start, w.end)}
                      className="phase-row"
                    >
                      <span className="text-[13px]">
                        {prettyDate(w.start)} → {prettyDate(w.end)}
                      </span>
                      <span className="num text-[12px] text-muted-foreground">
                        {w.days}d · {fmtPct(w.drift)}
                      </span>
                    </button>
                  );
                })}

                {sideways.data && windows.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No qualifying flat phase in this index's history.
                  </p>
                )}
              </div>

              <details className="mt-4 rounded-md border border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium">
                  Methodology · how a phase qualifies
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </summary>
                <div className="border-t border-border px-3 py-3">
                  <SidewaysMethodology locked={logicLocked} demo={demo} />
                  {activeWindow && (
                    <div className="mt-3">
                      <WindowReason
                        w={{ ...activeWindow, qualifies: true }}
                        indexLabel={indexDef.label}
                        locked={logicLocked}
                      />
                    </div>
                  )}
                </div>
              </details>

              {limited ? (
                <div className="mt-4">
                  <LockedPreview
                    title="Every window & custom date ranges"
                    hint="Pro unlocks all detected flat phases, any custom range, and every benchmark."
                    action={unlockAction}
                    minHeight={140}
                  >
                    <div className="flex flex-wrap items-end gap-3 p-4">
                      <Input type="date" className="w-44" readOnly value="" />
                      <Input type="date" className="w-44" readOnly value="" />
                      <Button size="sm">Analyse custom range</Button>
                    </div>
                  </LockedPreview>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
                  <div>
                    <label className="eyebrow">From</label>
                    <Input
                      type="date"
                      className="num mt-1 w-44"
                      value={range?.start ?? ""}
                      min={sideways.data?.first}
                      max={sideways.data?.last}
                      onChange={(e) =>
                        setRange((r) => ({ start: e.target.value, end: r?.end ?? "" }))
                      }
                    />
                  </div>
                  <div>
                    <label className="eyebrow">To</label>
                    <Input
                      type="date"
                      className="num mt-1 w-44"
                      value={range?.end ?? ""}
                      min={sideways.data?.first}
                      max={sideways.data?.last}
                      onChange={(e) => setRange((r) => ({ start: r?.start ?? "", end: e.target.value }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={!range?.start || !range?.end || range.start >= range.end}
                    onClick={() => setSubmitted({ start: range!.start, end: range!.end })}
                  >
                    Analyse custom range
                  </Button>
                </div>
              )}
            </section>

            {submitted && (
              <section className="mt-3">
                {analysis.isPending || analysis.isFetching ? (
                  <div className="panel">
                    <SkeletonRows rows={6} />
                  </div>
                ) : analysis.isError ? (
                  <div className="panel p-5 text-sm text-destructive">
                    {(analysis.error as Error).message}
                  </div>
                ) : analysis.data ? (
                  <>
                    <div className="panel p-4 sm:p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="text-base font-semibold">
                          Top {TOP_N} {catDef.label} funds
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className="num text-[11px] text-muted-foreground">
                            {analysis.data.indexLabel} {fmtPct(analysis.data.indexReturn)} ·{" "}
                            {analysis.data.analysed} screened · {prettyDate(analysis.data.start)} →{" "}
                            {prettyDate(analysis.data.end)}
                          </span>
                          {!FEATURES.pdfReport ? null : isPro ? (
                            <Button size="sm" onClick={exportPdf} disabled={exporting}>
                              <Download className="size-3.5" />
                              {exporting ? "Building…" : "PDF report"}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {/* Rank cards first — the headline read */}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {top3.map((f, i) => (
                          <RankCard
                            key={f.code}
                            fund={f}
                            rank={i + 1}
                            accent={RANK_COLORS[i] ?? RANK_COLORS[0]!}
                            isPro={isPro}
                            onFocusFund={setFocusFund}
                            onProfileLoaded={cacheProfile}
                            onHoldingsLoaded={cacheHoldings}
                          />
                        ))}
                      </div>

                      {/* Chart — one fund vs benchmark when a card is selected, else all top funds */}
                      {focusFund ? (
                        <div className="mt-5">
                          <FundChartPanel
                            code={focusFund.code}
                            name={focusFund.name}
                            indexKey={indexKey}
                            start={analysis.data.start}
                            end={analysis.data.end}
                            onClose={() => setFocusFund(null)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="mt-5 h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={analysis.data.series}
                                margin={{ top: 6, right: 6, bottom: 0, left: 0 }}
                              >
                                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                                  tickFormatter={(d: string) => d.slice(5)}
                                  minTickGap={36}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                                  domain={["dataMin - 2", "dataMax + 2"]}
                                  tickFormatter={(v: number) => v.toFixed(0)}
                                  width={44}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: "var(--color-popover)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 8,
                                    fontSize: 12,
                                  }}
                                  labelFormatter={(d) => prettyDate(String(d))}
                                  formatter={(v: number, k) => [
                                    v.toFixed(1),
                                    k === "index"
                                      ? analysis.data!.indexLabel
                                      : (top3[
                                          SERIES_KEYS.indexOf(
                                            String(k) as (typeof SERIES_KEYS)[number],
                                          )
                                        ]?.house ?? String(k)),
                                  ]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="index"
                                  stroke="var(--color-chart-2)"
                                  strokeWidth={2}
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                  dot={false}
                                />
                                {SERIES_KEYS.map((k, i) => (
                                  <Line
                                    key={k}
                                    type="monotone"
                                    dataKey={k}
                                    stroke={RANK_COLORS[i]}
                                    strokeWidth={2}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    dot={false}
                                    connectNulls
                                  />
                                ))}

                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="num mt-1 text-[11px] text-muted-foreground">
                            Rebased to 100 at window start · dashed = {analysis.data.indexLabel} ·
                            click a fund card to isolate one fund
                          </p>
                        </>
                      )}

                      {/* Ranked list last */}
                      <div className="mt-5">
                        <RankTable
                          funds={top3}
                          series={analysis.data.series}
                          locked={limited}
                          onFocusFund={setFocusFund}
                        />
                      </div>
                    </div>

                    {/* Free for everyone: analyse any individual fund */}
                    <SingleFundAnalyser
                      funds={analysis.data.funds}
                      indexKey={indexKey}
                      indexLabel={analysis.data.indexLabel}
                      start={analysis.data.start}
                      end={analysis.data.end}
                    />

                    <RankVisuals
                      funds={analysis.data.funds.filter((f) => f.eligible)}
                      indexLabel={analysis.data.indexLabel}
                      onFocusFund={setFocusFund}
                    />

                    {limited ? (
                      <div className="mt-3 space-y-3">
                        <LockedPreview
                          title="Full leaderboard, style grid, holdings & manager history"
                          hint="Sharpe / Sortino / Treynor context, the 3×3 style grid, fund-size stats and every screened scheme."
                          action={unlockAction}
                          minHeight={260}
                        >
                          <SkeletonRows rows={7} />
                        </LockedPreview>
                        <div className="panel p-4 sm:p-5">
                          <RankingMethodology locked demo={demo} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <RatioGuide category={category} categoryLabel={catDef.label} locked={logicLocked} />
                        <StyleGrid funds={analysis.data.funds} />

                        <div className="mt-6 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={showSize ? "default" : "outline"}
                            onClick={() => setShowSize((v) => !v)}
                          >
                            {showSize ? "Hide" : "Show"} fund size &amp; flows
                          </Button>
                          <Button
                            size="sm"
                            variant={showBoard ? "default" : "outline"}
                            onClick={() => setShowBoard((v) => !v)}
                          >
                            {showBoard ? "Hide" : "Show"} full category leaderboard
                          </Button>
                        </div>

                        {showSize && (
                          <CategorySizePanel categoryLabel={catDef.label} result={analysis.data} />
                        )}
                        {showBoard && (
                          <Leaderboard result={analysis.data} onFocusFund={setFocusFund} />
                        )}
                      </>
                    )}


                    {top3.length > 0 && (
                      <>
                        <div className="mt-6 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={showSip ? "default" : "outline"}
                            onClick={() => setShowSip((v) => !v)}
                          >
                            {showSip ? "Hide" : "Show"} SIP &amp; lumpsum outcome
                          </Button>
                          {FEATURES.overlap && (
                            <Button
                              size="sm"
                              variant={showOverlap ? "default" : "outline"}
                              onClick={() => setShowOverlap((v) => !v)}
                            >
                              {showOverlap ? "Hide" : "Show"} common stocks across top funds
                            </Button>
                          )}
                          {FEATURES.sectorDrift && (
                            <Button
                              size="sm"
                              variant={showDrift ? "default" : "outline"}
                              onClick={() => setShowDrift((v) => !v)}
                            >
                              {showDrift ? "Hide" : "Show"} sector allocation drift
                            </Button>
                          )}
                        </div>

                        {showSip && (
                          <SipCalculator
                            funds={top3.map((f) => ({ code: f.code, name: f.name }))}
                            indexKey={indexKey}
                            start={analysis.data.start}
                            end={analysis.data.end}
                            locked={limited}
                            onUnlock={upgradeCta}
                          />
                        )}
                        {showOverlap && (
                          <OverlapPanel
                            category={category}
                            indexKey={indexKey}
                            start={analysis.data.start}
                            end={analysis.data.end}
                            onUnlock={upgradeCta}
                          />
                        )}
                        {showDrift && (
                          <SectorDrift
                            code={top3[0]!.code}
                            name={top3[0]!.name}
                            onUnlock={upgradeCta}
                          />
                        )}
                      </>
                    )}
                  </>
                ) : null}
              </section>
            )}
          </>
        )}

        {view === "combined" && (
          <div className="mt-3">
            {limited ? (
              <LockedPreview
                title="Combined ranking across the last 3 sideways phases"
                hint="Blend every recent flat phase into one consistency-weighted leaderboard."
                action={unlockAction}
                minHeight={280}
              >
                <SkeletonRows rows={7} />
              </LockedPreview>
            ) : (
              <Suspense fallback={<div className="panel"><SkeletonRows rows={7} /></div>}>
                <CombinedRanking
                  category={category}
                  categoryLabel={catDef.label}
                  indexKey={indexKey}
                  isPro={isPro}
                  onUnlock={upgradeCta}
                />
              </Suspense>
            )}
          </div>
        )}

        {view === "dips" && (
          <div className="mt-3">
            {limited ? (
              <LockedPreview
                title="Dip radar — ranked funds 5–10% off their peak"
                hint="Track top-ranked schemes trading just below their 1-year NAV high."
                action={unlockAction}
                minHeight={260}
              >
                <SkeletonRows rows={6} />
              </LockedPreview>
            ) : (
              <Suspense fallback={<div className="panel"><SkeletonRows rows={6} /></div>}>
                <DipRadar category={category} categoryLabel={catDef.label} indexKey={indexKey} />
              </Suspense>
            )}
          </div>
        )}

        {view === "calc" && (
          <div className="mt-3">
            {submitted && analysis.data ? (
              <Suspense fallback={<div className="panel"><SkeletonRows rows={5} /></div>}>
                <CalculatorSection
                  category={category}
                  categoryLabel={catDef.label}
                  indexKey={indexKey}
                  start={analysis.data.start}
                  end={analysis.data.end}
                  onUnlock={upgradeCta}
                />
                {top3.length > 0 && (
                  <SipCalculator
                    funds={top3.map((f) => ({ code: f.code, name: f.name }))}
                    indexKey={indexKey}
                    start={analysis.data.start}
                    end={analysis.data.end}
                    locked={limited}
                    onUnlock={upgradeCta}
                  />
                )}
              </Suspense>
            ) : (
              <div className="panel">
                <SkeletonRows rows={5} />
              </div>
            )}
          </div>
        )}

        {view === "model" && FEATURES.modelPortfolio && (
          <div className="mt-3">
            <Suspense fallback={<div className="panel"><SkeletonRows rows={6} /></div>}>
              <ModelPortfolio onUnlock={upgradeCta} />
            </Suspense>
          </div>
        )}

        <footer className="mt-8 -mx-5 border-t border-border bg-[var(--bg-alt)] px-5 pb-6 pt-4 text-[11px] text-muted-foreground sm:-mx-8 sm:px-8">
          <details className="rounded-md border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-medium text-foreground">
              Disclaimer & data notes
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </summary>
            <div className="space-y-2 border-t border-border px-3 py-3">
              <p>
                Mutual fund investments are subject to market risks. Read all scheme related
                documents carefully before investing. Past performance is not indicative of future
                returns, and the NAV of schemes may go up or down depending on market conditions.
              </p>
              <p>
                MF Lens is an independent research and analytics tool. It does not offer investment,
                legal or tax advice, does not recommend any scheme, and is not a SEBI-registered
                investment adviser or distributor. Rankings are quantitative outputs of publicly
                available NAV data and may contain errors or omissions.
              </p>
              <p className="num">
                Universe: direct plan, growth option only; one scheme per fund house. Source: AMFI
                daily NAV, refreshed every business day.
              </p>
            </div>
          </details>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/methodology" className="hover:text-foreground">
              Methodology
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <a href="mailto:support@mutualfundlens.app" className="hover:text-foreground">
              Support & grievances
            </a>
            <span className="ml-auto">© {new Date().getFullYear()} MF Lens</span>
          </div>
        </footer>

      </main>

      {showAdminSettings && (
        <AdminSettingsPanel onClose={() => setShowAdminSettings(false)} />
      )}
    </>
  );
}
