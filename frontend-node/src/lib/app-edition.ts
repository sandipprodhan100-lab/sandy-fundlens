/**
 * Open edition of MF Lens: everything unlocked for everyone, no paywall prompts.
 * Full analytics, model portfolio, sector drift, holdings overlap, PDF reports,
 * sideways scanning and custom date ranges are open to all visitors.
 */

export const APP_EDITION = "open" as const;
export const isOpenEdition = true;

/** All sideways windows are accessible without restriction. */
export const DEMO_WINDOW_LIMIT = Infinity;

/** Methodology and rationale are visible to all users. */
export const LOGIC_LOCKED = false;
export const isLogicLocked = (_limited?: boolean) => false;

/**
 * All analytical and reporting features are fully enabled and open.
 */
export const FEATURES = {
  /** Pricing page / subscription paywalls are disabled */
  pricing: false,
  /** Institutional model portfolio builder */
  modelPortfolio: true,
  /** Sector allocation drift (6m / 3m) */
  sectorDrift: true,
  /** Common-holdings overlap across top funds */
  overlap: true,
  /** Downloadable PDF research report */
  pdfReport: true,
  /** AI Analyst agent */
  analyst: true,
} as const;

/** Questions a signed-out visitor may ask the analyst in one session. */
export const TRIAL_ANALYST_TURNS = 10;
