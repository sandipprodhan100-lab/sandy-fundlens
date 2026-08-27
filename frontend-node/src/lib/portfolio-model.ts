/**
 * Model mutual-fund allocations.
 *
 * Weights follow mainstream institutional practice rather than a house view:
 *  - a market-cap-weighted core (India's free-float is ~70% large cap, which is
 *    why flexi/multi + large together dominate every sleeve),
 *  - satellite caps borrowed from global endowment/target-date practice: no
 *    single satellite above 20%, mid+small combined capped at 35% even for
 *    aggressive investors,
 *  - an emerging-market small-cap ceiling (MSCI EM small caps are ~14% of the
 *    EM opportunity set; going far beyond that is a liquidity bet, not a
 *    diversification one),
 *  - a debt/hybrid sleeve sized to the horizon, in line with the "age in bonds
 *    minus horizon" convention used by most glide-path funds.
 */

import type { CategoryKey } from "./mf-catalog";

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type Sleeve = {
  category: CategoryKey;
  weight: number;
  role: string;
  standard: string;
};

export type ModelDef = {
  key: RiskProfile;
  label: string;
  horizon: string;
  summary: string;
  equityPct: number;
  sleeves: Sleeve[];
  rebalance: string;
};

export const MODELS: ModelDef[] = [
  {
    key: "conservative",
    label: "Conservative",
    horizon: "3–5 years",
    summary:
      "Capital preservation first. Two-thirds of the risk budget sits in large caps and an aggressive-hybrid debt sleeve, so a sideways or falling market costs far less than a pure equity book.",
    equityPct: 65,
    sleeves: [
      {
        category: "hybrid",
        weight: 35,
        role: "Debt + equity ballast",
        standard: "Glide-path convention: a 3–5 year horizon carries ~35% non-equity risk.",
      },
      {
        category: "large",
        weight: 30,
        role: "Core beta",
        standard: "Market-cap-weighted core — large caps are ~70% of India's free float.",
      },
      {
        category: "flexi",
        weight: 25,
        role: "Manager flexibility",
        standard: "Single active satellite kept at or below 25% of the book.",
      },
      {
        category: "mid",
        weight: 10,
        role: "Measured growth tilt",
        standard: "Mid+small capped at 10% at this risk level; no small-cap sleeve.",
      },
    ],
    rebalance: "Review twice a year; rebalance when any sleeve drifts more than 5pp from target.",
  },
  {
    key: "balanced",
    label: "Balanced",
    horizon: "5–7 years",
    summary:
      "The default. A flexi/multi core does the compounding, large caps stabilise it, mid and small add the emerging-market growth premium within standard caps, and a hybrid sleeve absorbs drawdowns.",
    equityPct: 85,
    sleeves: [
      {
        category: "flexi",
        weight: 30,
        role: "Core",
        standard: "Cap-agnostic core, the closest active proxy to a total-market holding.",
      },
      {
        category: "multi",
        weight: 15,
        role: "Rules-based core",
        standard: "SEBI's mandated 25/25/25 split enforces cap discipline the flexi sleeve lacks.",
      },
      {
        category: "large",
        weight: 20,
        role: "Stability",
        standard: "Market-cap-weighted anchor.",
      },
      {
        category: "mid",
        weight: 15,
        role: "Growth tilt",
        standard: "Satellite ceiling of 20% per category.",
      },
      {
        category: "small",
        weight: 5,
        role: "High-beta sleeve",
        standard: "Near the ~14% MSCI EM small-cap share once mid caps are counted.",
      },
      {
        category: "hybrid",
        weight: 15,
        role: "Drawdown buffer",
        standard: "Keeps ~15% in debt-bearing assets for rebalancing ammunition.",
      },
    ],
    rebalance:
      "Rebalance annually, or when a sleeve drifts 5pp. Redirect fresh SIPs to the underweight sleeve before selling anything.",
  },
  {
    key: "aggressive",
    label: "Aggressive",
    horizon: "7–10+ years",
    summary:
      "Maximum equity within recognised caps. Mid and small caps run at their standard ceiling, and the hybrid sleeve stays only as dry powder for the drawdowns that follow flat phases.",
    equityPct: 95,
    sleeves: [
      {
        category: "flexi",
        weight: 30,
        role: "Core",
        standard: "Cap-agnostic core stays the largest single sleeve at every risk level.",
      },
      {
        category: "mid",
        weight: 20,
        role: "Growth engine",
        standard: "At the 20% single-satellite ceiling.",
      },
      {
        category: "small",
        weight: 15,
        role: "High-beta sleeve",
        standard: "Mid+small held to 35% combined — the usual EM liquidity limit.",
      },
      {
        category: "multi",
        weight: 15,
        role: "Rules-based core",
        standard: "Adds enforced large-cap exposure without a passive sleeve.",
      },
      {
        category: "large",
        weight: 15,
        role: "Anchor",
        standard: "Minimum large-cap floor so the book is not purely small/mid beta.",
      },
      {
        category: "hybrid",
        weight: 5,
        role: "Dry powder",
        standard: "Small buffer to fund rebalancing after a drawdown.",
      },
    ],
    rebalance:
      "Rebalance annually with a 7pp drift band — wider bands avoid churning a high-volatility book.",
  },
];

export const MODEL_DISCLAIMER =
  "Illustrative allocation for education only. It is not investment advice, and fund picks reflect past behaviour in flat markets, which may not repeat.";
