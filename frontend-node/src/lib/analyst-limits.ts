/** Shared, client-safe analyst quota constants. */
export const FREE_MONTHLY_TURNS = 5;
export const FREE_DAILY_TURNS = 5;
export const PRO_DAILY_TURNS = 10;

/** Extra question pack: ₹299 flat for 30 AI analysis queries */
export const TOPUP_PACKS = [
  { priceId: "analyst_pack_30" as const, questions: 30, price: 299, label: "30 extra questions (₹299)" },
];

export const PACK_CREDITS: Record<string, number> = {
  analyst_pack_30: 30,
};
