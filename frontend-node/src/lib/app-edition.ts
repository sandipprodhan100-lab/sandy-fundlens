/**
 * Two shipping editions of MF Lens.
 *
 * - "open"         — everything unlocked for everyone, no paywall prompts.
 *                    Used for the public preview/launch so people can try the
 *                    full analysis without signing up or paying.
 * - "subscription" — free demo + Pro gating (the paid product).
 *
 * Controlled by VITE_APP_EDITION so the same codebase builds either version.
 */
export type AppEdition = "open" | "subscription";

export const APP_EDITION: AppEdition =
  (import.meta.env["VITE_APP_EDITION"] as AppEdition) === "subscription"
    ? "subscription"
    : "open";

export const isOpenEdition = APP_EDITION === "open";

/** How many sideways windows the free/demo experience may pick from. */
export const DEMO_WINDOW_LIMIT = isOpenEdition ? Infinity : 3;

/**
 * The demo/open edition shows every analysis *result*, but the underlying
 * ideology — exact thresholds, scoring formula, per-category weights and
 * ratio maths — stays reserved for the paid product.
 */
export const LOGIC_LOCKED = isOpenEdition;

/** Methodology visibility for a given paywall state. */
export const isLogicLocked = (limited: boolean) => LOGIC_LOCKED || limited;

/**
 * Feature split between the two shipping versions.
 *
 * Version 1 ("open") ships ~70% of the product: every ranking module, charts,
 * holdings, calculators, single-fund analysis — free, with no pricing surface.
 * Version 2 ("subscription") adds the reserved 30%: model portfolio, sector
 * drift, holdings overlap, PDF reports and the AI Analyst, plus the paywall.
 */
export const FEATURES = {
  /** Pricing page, upgrade CTAs, checkout, plan banners. */
  pricing: !isOpenEdition,
  /** Institutional model portfolio builder. */
  modelPortfolio: true,
  /** Sector allocation drift (6m / 3m). */
  sectorDrift: !isOpenEdition,
  /** Common-holdings overlap across the top funds. */
  overlap: !isOpenEdition,
  /** Downloadable PDF research report. */
  pdfReport: !isOpenEdition,
  /** AI Analyst agent + daily quota / top-ups. */
  analyst: true,
} as const;

/** Questions a signed-out visitor may ask the analyst in one browser session. */
export const TRIAL_ANALYST_TURNS = 3;
