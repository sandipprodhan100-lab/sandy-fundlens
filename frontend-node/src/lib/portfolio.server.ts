/**
 * Builds a model portfolio: standard sleeve weights (portfolio-model.ts) filled
 * with the current top-ranked fund of each category from the sideways analysis.
 */

import { CATEGORIES, type CategoryKey } from "./mf-catalog";
import { MODELS, type RiskProfile } from "./portfolio-model";
import { analyse, detectSideways } from "./mf.server";
import { memoise } from "./memo.server";

export type PortfolioPick = {
  category: CategoryKey;
  categoryLabel: string;
  weight: number;
  role: string;
  standard: string;
  window: { start: string; end: string } | null;
  primary: {
    code: number;
    name: string;
    house: string;
    alpha: number;
    score: number;
    cagr3y: number | null;
    sharpe: number | null;
    aumCrore: number | null;
  } | null;
  alternate: { code: number; name: string; house: string; alpha: number } | null;
  note: string | null;
};

export type PortfolioResult = {
  profile: RiskProfile;
  label: string;
  horizon: string;
  summary: string;
  equityPct: number;
  rebalance: string;
  monthly: number;
  sleeves: PortfolioPick[];
  /** weighted alpha of the picked funds during their sideways windows */
  blendedAlpha: number | null;
};

async function buildPortfolioUncached(input: {
  profile: RiskProfile;
  monthly: number;
  /** free tier gets sleeve weights only, no fund picks */
  withPicks: boolean;
}): Promise<PortfolioResult> {
  const model = MODELS.find((m) => m.key === input.profile) ?? MODELS[1]!;

  const sleeves: PortfolioPick[] = await Promise.all(
    model.sleeves.map(async (s) => {
      const def = CATEGORIES.find((c) => c.key === s.category)!;
      const base: PortfolioPick = {
        category: s.category,
        categoryLabel: def.label,
        weight: s.weight,
        role: s.role,
        standard: s.standard,
        window: null,
        primary: null,
        alternate: null,
        note: null,
      };
      if (!input.withPicks) return base;
      try {
        const { readAnalysisSnapshot } = await import("./mf-snapshots.server");
        let result = (await readAnalysisSnapshot(s.category, def.defaultIndex)) as any;
        if (!result) {
          const { windows } = await detectSideways(def.defaultIndex);
          const w = windows[0];
          if (!w) return { ...base, note: "No qualifying flat phase for this benchmark." };
          result = await analyse({
            category: s.category,
            indexKey: def.defaultIndex,
            start: w.start,
            end: w.end,
          });
        }
        const ranked = result.funds.filter((f: any) => f.eligible);
        const [first, second] = ranked;
        return {
          ...base,
          window: { start: result.start, end: result.end },
          primary: first
            ? {
                code: first.code,
                name: first.name,
                house: first.house,
                alpha: first.alpha,
                score: first.score,
                cagr3y: first.cagr3y,
                sharpe: first.sharpe,
                aumCrore: first.aumCrore,
              }
            : null,
          alternate: second
            ? { code: second.code, name: second.name, house: second.house, alpha: second.alpha }
            : null,
        };
      } catch (error) {
        return {
          ...base,
          note: error instanceof Error ? error.message : "Ranking unavailable for this sleeve.",
        };
      }
    }),
  );

  const withAlpha = sleeves.filter((s) => s.primary);
  const weightSum = withAlpha.reduce((a, s) => a + s.weight, 0);

  return {
    profile: model.key,
    label: model.label,
    horizon: model.horizon,
    summary: model.summary,
    equityPct: model.equityPct,
    rebalance: model.rebalance,
    monthly: input.monthly,
    sleeves,
    blendedAlpha: weightSum
      ? Math.round(
          (withAlpha.reduce((a, s) => a + s.weight * (s.primary!.alpha ?? 0), 0) / weightSum) * 100,
        ) / 100
      : null,
  };
}

/** Model portfolio spans every category; memoise per profile + tier. */
export const buildPortfolio = memoise(
  buildPortfolioUncached,
  (i: { profile: RiskProfile; monthly: number; withPicks: boolean }) =>
    `${i.profile}|${i.monthly}|${i.withPicks ? "pro" : "free"}`,
);
