/** Shared, client-safe analyst quota constants. */
export const FREE_DAILY_TURNS = 5;
/** Pro daily allowance. Extra questions come from purchased top-up packs. */
export const PRO_DAILY_TURNS = 10;

export const TOPUP_PACKS = [
  { priceId: "analyst_pack_10" as const, questions: 10, label: "10 extra questions" },
  { priceId: "analyst_pack_20" as const, questions: 20, label: "20 extra questions" },
];

export const PACK_CREDITS: Record<string, number> = {
  analyst_pack_10: 10,
  analyst_pack_20: 20,
};
