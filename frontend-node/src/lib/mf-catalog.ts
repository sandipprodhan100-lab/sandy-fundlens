export type CategoryKey = "large" | "mid" | "small" | "multi" | "flexi" | "hybrid";

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  /** search term(s), "|"-separated, matched against the AMFI scheme directory */
  query: string;
  /** substring that must appear in the scheme's official category */
  categoryMatch: string;
  /** default benchmark index proxy */
  defaultIndex: IndexKey;
};

export const CATEGORIES: CategoryDef[] = [
  {
    key: "large",
    label: "Large Cap",
    query: "Large Cap",
    categoryMatch: "large cap fund",
    defaultIndex: "nifty50",
  },
  {
    key: "mid",
    label: "Mid Cap",
    query: "Mid Cap",
    categoryMatch: "mid cap fund",
    defaultIndex: "midcap150",
  },
  {
    key: "small",
    label: "Small Cap",
    query: "Small Cap",
    categoryMatch: "small cap fund",
    defaultIndex: "smallcap250",
  },
  {
    key: "multi",
    label: "Multi Cap",
    query: "Multi Cap",
    categoryMatch: "multi cap fund",
    defaultIndex: "nifty500",
  },
  {
    key: "flexi",
    label: "Flexi Cap",
    query: "Flexi Cap",
    categoryMatch: "flexi cap fund",
    defaultIndex: "nifty500",
  },
  {
    key: "hybrid",
    label: "Aggressive Hybrid",
    query: "Hybrid|Equity & Debt|Equity and Debt|Balanced",
    categoryMatch: "aggressive hybrid",
    defaultIndex: "nifty50",
  },
];

export type IndexKey = "nifty50" | "midcap150" | "smallcap250" | "nifty500";

export const INDEXES: { key: IndexKey; label: string; code: number; fallbacks?: number[]; proxy: string }[] = [
  { key: "nifty50", label: "Nifty 50", code: 120716, fallbacks: [118881], proxy: "UTI Nifty 50 Index Fund (Direct, Growth)" },
  {
    key: "midcap150",
    label: "Nifty Midcap 150",
    code: 148726,
    fallbacks: [147622],
    proxy: "Nippon India Nifty Midcap 150 Index Fund (Direct, Growth)",
  },
  {
    key: "smallcap250",
    label: "Nifty Smallcap 250",
    code: 148519,
    fallbacks: [151727],
    proxy: "Nippon India Nifty Smallcap 250 Index Fund (Direct, Growth)",
  },
  { key: "nifty500", label: "Nifty 500", code: 152731, fallbacks: [147625], proxy: "Axis Nifty 500 Index Fund (Direct, Growth)" },
];


export type NavPoint = { date: string; nav: number };

export type SidewaysWindow = {
  start: string;
  end: string;
  days: number;
  drift: number;
  band: number;
};

export type SizeBucket = "large" | "mid" | "small";
export type StyleBucket = "value" | "growth" | "momentum";

export type FundResult = {
  code: number;
  name: string;
  house: string;
  category: string;
  return: number;
  annualised: number;
  alpha: number;
  maxDrawdown: number;
  volatility: number;
  upDays: number;
  score: number;
  sizeBucket: SizeBucket;
  styleBucket: StyleBucket;
  beta: number;
  upCapture: number;
  downCapture: number;
  tilt: number;
  momentum: number;
  sizeBasis: string;
  cagr1y: number | null;
  cagr3y: number | null;
  cagr5y: number | null;
  cagr10y: number | null;
  cagrSince: number | null;
  cagrAsOf: string;
  /** risk-adjusted ratios over the trailing 3-year window ending at cagrAsOf */
  sharpe: number | null;
  sortino: number | null;
  treynor: number | null;
  /** compounded fund return across days the benchmark fell (3y window), % */
  drawdownReturn: number;
  /** benchmark's own compounded return on those same falling days, % */
  benchDrawdownReturn: number;
  /** share of rolling 3-month windows (3y) where the fund beat the benchmark, % */
  consistency: number;
  /** longest stretch, in months, with no NAV manager-style regime break — proxy for a steady hand */
  ratioBasis: string;
  /** current fund size in ₹ crore (null when the public source has no figure) */
  aumCrore: number | null;
  /** fund size as a multiple of the category average (1 = average) */
  aumVsAvg: number | null;
  /** estimated net investor inflow (+) / outflow (−) in ₹ crore, latest quarter */
  flowQ1: number | null;
  /** same, for the quarter before that */
  flowQ2: number | null;
  flowNote: string | null;
  /** first published NAV date */
  inception: string;
  ageYears: number;
  /** passes the age + fund-size screens used for ranking */
  eligible: boolean;
  ineligibleReason: string | null;
};

export const RISK_FREE = 6.5;

export type RatioGuide = {
  ratio: "Sharpe" | "Sortino" | "Treynor";
  formula: string;
  what: string;
  india: string;
};

export const RATIO_GUIDE: RatioGuide[] = [
  {
    ratio: "Sharpe",
    formula: "(Fund CAGR − 6.5% T-bill) ÷ total volatility",
    what: "Excess return per unit of total risk (both up and down swings).",
    india:
      "The 6.5% risk-free leg is the 364-day T-bill/repo level, so Sharpe answers the question every Indian investor actually asks: was the equity risk worth it versus a fixed deposit?",
  },
  {
    ratio: "Sortino",
    formula: "(Fund CAGR − 6.5%) ÷ downside deviation",
    what: "Excess return per unit of downside risk only — upside volatility is not penalised.",
    india:
      "Indian mid and small caps rally violently and crash violently; Sharpe punishes the rallies. Sortino isolates the falls, which is what hurts an SIP investor in a 2018 or 2025-style small-cap drawdown.",
  },
  {
    ratio: "Treynor",
    formula: "(Fund CAGR − 6.5%) ÷ beta vs the benchmark",
    what: "Excess return per unit of market (systematic) risk.",
    india:
      "Large-cap and index-hugging funds carry almost only market risk — the Nifty 50 drives most of their NAV. Treynor shows whether the manager earned anything beyond simply taking Nifty beta, which is the live active-vs-index debate in India.",
  },
];

/** which ratio leads the ranking for each category, and why in the Indian market */
export const CATEGORY_RATIO_FOCUS: Record<
  CategoryKey,
  { primary: RatioGuide["ratio"]; extra: string; why: string }
> = {
  large: {
    primary: "Treynor",
    extra: "Alpha vs the Nifty 50",
    why: "Large-cap portfolios are ~90% market risk and most now trail the index after TER, so return per unit of beta is the honest test of the manager.",
  },
  mid: {
    primary: "Sortino",
    extra: "Return during benchmark drawdowns",
    why: "Indian mid caps swing far harder than the Nifty; protecting the downside compounds more than chasing the upside.",
  },
  small: {
    primary: "Sortino",
    extra: "Max drawdown control",
    why: "Small caps in India routinely fall 30–50% in a de-rating; downside deviation and drawdown behaviour separate survivors from lucky rallies.",
  },
  multi: {
    primary: "Sharpe",
    extra: "Consistency across rolling 3-month windows",
    why: "SEBI forces a 25/25/25 large-mid-small split, so the differentiator is total risk-efficiency of the allocation, not any single cap bet.",
  },
  flexi: {
    primary: "Sharpe",
    extra: "Consistency across rolling 3-month windows",
    why: "Flexi caps are free to rotate across market caps, so risk-adjusted consistency shows whether the manager's calls actually added value.",
  },
  hybrid: {
    primary: "Sharpe",
    extra: "Return during benchmark drawdowns",
    why: "Aggressive hybrids hold 65-80% equity plus debt, so the whole point is smoother total risk: Sharpe against the Nifty 50 plus down-market behaviour shows whether the debt leg is actually earning its place.",
  },
};


export type CareerStep = { organisation: string; role: string | null; period: string | null };

export type WindowStats = {
  start: string;
  end: string;
  days: number;
  drift: number;
  band: number;
  qualifies: boolean;
};

export const TOP_N = 5;

export const SERIES_KEYS = ["a", "b", "c", "d", "e"] as const;
export type SeriesKey = (typeof SERIES_KEYS)[number];

export type SeriesPoint = { date: string; index: number } & Partial<Record<SeriesKey, number>>;

export type FundProfile = {
  manager: string | null;
  managerSince: string | null;
  managerRole: string | null;
  managerExperience: string | null;
  career: CareerStep[];
  previousEmployment: string[];
  otherFunds: string[];
  aumCrore: number | null;
  avgMarketCapCrore: number | null;
  source: string | null;
  note: string | null;
};

export type CategorySizeStats = {
  funds: { code: number; name: string; house: string; aumCrore: number | null }[];
  min: number | null;
  max: number | null;
  avg: number | null;
  covered: number;
  note: string | null;
};

export type AnalysisResult = {
  category: CategoryKey;
  indexKey: IndexKey;
  indexLabel: string;
  start: string;
  end: string;
  indexReturn: number;
  indexDrift: number;
  analysed: number;
  /** funds that cleared the age + fund-size screens and are actually ranked */
  ranked: number;
  aum: {
    min: number | null;
    max: number | null;
    avg: number | null;
    covered: number;
    /** minimum fund size accepted for ranking (15% of the category average) */
    floor: number | null;
  };
  screen: { minAgeYears: number; minAumShare: number };
  window: WindowStats;
  funds: FundResult[];

  series: SeriesPoint[];
};

export type Holding = {
  name: string;
  weight: number | null;
  sector: string | null;
};

export type HoldingsResult = {
  holdings: Holding[];
  source: string | null;
  asOf: string | null;
  note: string | null;
};

export const SIZE_ROWS: { key: SizeBucket; label: string }[] = [
  { key: "large", label: "Large cap" },
  { key: "mid", label: "Mid cap" },
  { key: "small", label: "Small cap" },
];

export const STYLE_COLS: { key: StyleBucket; label: string; hint: string }[] = [
  {
    key: "value",
    label: "Value",
    hint: "Defensive NAV behaviour: below-median beta and volatility, loses less than the index when it falls.",
  },
  {
    key: "growth",
    label: "Growth",
    hint: "Captures more of the index's upside than its downside, with above-median volatility.",
  },
  {
    key: "momentum",
    label: "Momentum",
    hint: "Trend-persistent NAV: strong 6-month return continuation and an aggressive beta.",
  },
];

export const SIDEWAYS_RULE = {
  minDays: 90,
  maxDrift: 5,
  maxBand: 10,
};


export const fmtCrore = (v: number | null) =>
  v === null ? "—" : v >= 100000 ? `₹${(v / 100000).toFixed(2)} lakh cr` : `₹${Math.round(v).toLocaleString("en-IN")} cr`;

export const fmtCagr = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

export const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

export function toISO(ddmmyyyy: string) {
  const [d, m, y] = ddmmyyyy.split("-");
  return `${y}-${m}-${d}`;
}

export function prettyDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ---- combined multi-window ranking ---- */

export type CombinedWindowEntry = {
  start: string;
  end: string;
  rank: number;
  score: number;
  alpha: number;
  return: number;
};

export type CombinedFund = {
  code: number;
  name: string;
  house: string;
  aumCrore: number | null;
  sizeBucket: SizeBucket;
  styleBucket: StyleBucket;
  appearances: number;
  avgScore: number;
  avgAlpha: number;
  bestRank: number;
  worstRank: number;
  combinedScore: number;
  windows: CombinedWindowEntry[];
  /** blended risk / ratio sheet across the phases the fund qualified in */
  metrics: CombinedMetrics;
};

export type CombinedMetrics = {
  /** averages across the qualifying phases */
  avgReturn: number;
  avgMaxDrawdown: number;
  avgVolatility: number;
  avgUpDays: number;
  avgBeta: number;
  /** trailing 3-year ratios taken from the most recent qualifying phase */
  sharpe: number | null;
  sortino: number | null;
  treynor: number | null;
  consistency: number;
  upCapture: number;
  downCapture: number;
  drawdownReturn: number;
  benchDrawdownReturn: number;
  cagr3y: number | null;
  cagr5y: number | null;
  ratioBasis: string;
};

export type CombinedResult = {
  category: CategoryKey;
  indexKey: IndexKey;
  indexLabel: string;
  windows: { start: string; end: string; days: number; drift: number; band: number }[];
  funds: CombinedFund[];
};

/** ---- dip radar ---- */

export type DipFund = {
  code: number;
  name: string;
  house: string;
  aumCrore: number | null;
  rank: number;
  score: number;
  alpha: number;
  sharpe: number | null;
  cagr3y: number | null;
  peakDate: string;
  peakNav: number;
  latestDate: string;
  latestNav: number;
  dipPct: number;
};

export type DipResult = {
  category: CategoryKey;
  indexKey: IndexKey;
  indexLabel: string;
  window: { start: string; end: string };
  asOf: string;
  band: { min: number; max: number };
  scanned: number;
  funds: DipFund[];
};

export const DIP_BAND = { min: 5, max: 10 };
