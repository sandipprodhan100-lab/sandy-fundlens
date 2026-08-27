import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanId = "funslense_pro_monthly" | "funslense_pro_annual";

/** Promotion applied automatically for everyone until an admin disables it. */
export const DEFAULT_PROMO_CODE = "MF50";

export type Plan = {
  priceId: PlanId;
  paddlePriceId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  formatted: string;
  interval: "month" | "year" | null;
  intervalFrequency: number;
};

const PLAN_META: Record<PlanId, { name: string; description: string }> = {
  funslense_pro_monthly: {
    name: "Pro Monthly",
    description: "Rolling monthly plan. Renews until you cancel.",
  },
  funslense_pro_annual: {
    name: "Pro Annual",
    description: "Full analysis, renews every year. Cancel anytime.",
  },
};

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  } catch {
    return `${currency} ${(amount / 100).toFixed(0)}`;
  }
}

/** One cached listing call covers every price — Paddle rate-limits per minute. */
async function listPrices(env: "sandbox" | "live"): Promise<any[]> {
  const { paddleFetchCached } = await import("@/lib/paddle.server");
  const res = await paddleFetchCached(env, `/prices?status=active&per_page=100`);
  return res?.data ?? [];
}

/**
 * A price ID can have several active provider prices if an amount was changed.
 * Always take the most recently created one so checkout charges the current amount.
 */
function findLatestPrice(prices: any[], externalId: string): any | null {
  const matches = prices.filter(
    (p) => p?.import_meta?.external_id === externalId && p?.status !== "archived"
  );
  if (!matches.length) return null;
  return matches.sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )[0];
}

function toPlan(price: any, priceId: PlanId): Plan {
  const amount = Number(price.unit_price?.amount ?? 0);
  const currency = price.unit_price?.currency_code ?? "INR";
  return {
    priceId,
    paddlePriceId: price.id,
    ...PLAN_META[priceId],
    amount,
    currency,
    formatted: formatAmount(amount, currency),
    interval:
      price.billing_cycle?.interval === "year"
        ? "year"
        : price.billing_cycle?.interval === "month"
          ? "month"
          : null,
    intervalFrequency: Number(price.billing_cycle?.frequency ?? 1),
  };
}

/** Public: live plan pricing straight from the payment provider. */
export const getPlans = createServerFn({ method: "GET" })
  .inputValidator((data: { environment: "sandbox" | "live" }) => data)
  .handler(async ({ data }) => {
    const prices = await listPrices(data.environment);
    const ids: PlanId[] = ["funslense_pro_monthly", "funslense_pro_annual"];
    return ids
      .map((id) => {
        const price = findLatestPrice(prices, id);
        return price ? toPlan(price, id) : null;
      })
      .filter((p): p is Plan => !!p);
  });

export type Topup = {
  priceId: string;
  questions: number;
  amount: number;
  currency: string;
  formatted: string;
};

/** Public: analyst question top-up packs (one-time purchases). */
export const getTopups = createServerFn({ method: "GET" })
  .inputValidator((data: { environment: "sandbox" | "live" }) => data)
  .handler(async ({ data }): Promise<Topup[]> => {
    const { TOPUP_PACKS } = await import("@/lib/analyst-limits");
    const prices = await listPrices(data.environment);
    return TOPUP_PACKS.map((pack): Topup | null => {
      const price = findLatestPrice(prices, pack.priceId);
      if (!price) return null;
      const amount = Number(price.unit_price?.amount ?? 0);
      const currency = price.unit_price?.currency_code ?? "INR";
      return {
        priceId: pack.priceId,
        questions: pack.questions,
        amount,
        currency,
        formatted: formatAmount(amount, currency),
      };
    }).filter((t): t is Topup => !!t);
  });

/** Public: resolve a human-readable price ID to the provider's internal ID. */
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: "sandbox" | "live" }) => data)
  .handler(async ({ data }) => {
    const prices = await listPrices(data.environment);
    const id = findLatestPrice(prices, data.priceId)?.id;
    if (!id) throw new Error(`Price ${data.priceId} not found in ${data.environment}`);
    return id as string;

  });

/** Authenticated: purchases + subscriptions for the billing/account page. */
export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: "sandbox" | "live" }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [purchases, subscriptions, pro, roles] = await Promise.all([
      context.supabase
        .from("purchases")
        .select("*")
        .eq("user_id", context.userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", context.userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false }),
      supabaseAdmin.rpc("has_pro_access", {
        user_uuid: context.userId,
        check_env: data.environment,
      }),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);

    const isAdmin = (roles.data ?? []).some((r: { role: string }) => r.role === "admin");

    return {
      purchases: purchases.data ?? [],
      subscriptions: subscriptions.data ?? [],
      isPro: !!pro.data,
      isAdmin,
    };
  });

/** Authenticated: hosted customer portal (manage payment method, cancel, invoices). */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: "sandbox" | "live" }) => data)
  .handler(async ({ data, context }) => {
    const { data: subs } = await context.supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1);

    let customerId = subs?.[0]?.paddle_customer_id as string | undefined;
    const subscriptionId = subs?.[0]?.paddle_subscription_id as string | undefined;

    if (!customerId) {
      const { data: purchases } = await context.supabase
        .from("purchases")
        .select("paddle_customer_id")
        .eq("user_id", context.userId)
        .eq("environment", data.environment)
        .not("paddle_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);
      customerId = (purchases?.[0]?.paddle_customer_id as string | undefined) ?? undefined;
    }

    if (!customerId) throw new Error("No billing account found yet.");

    const { paddleFetch } = await import("@/lib/paddle.server");
    const res = await paddleFetch(
      data.environment,
      `/customers/${customerId}/portal-sessions`,
      {
        method: "POST",
        body: JSON.stringify(subscriptionId ? { subscription_ids: [subscriptionId] } : {}),
      }
    );

    const url =
      res?.data?.urls?.general?.overview ?? res?.data?.urls?.subscriptions?.[0]?.cancel_subscription;
    if (!url) throw new Error("Could not open the billing portal.");
    return url as string;
  });

export type PromoCode = {
  id: string;
  code: string;
  description: string;
  percentOff: number | null;
  status: string;
  enabledForCheckout: boolean;
  timesUsed: number;
  expiresAt: string | null;
};

function toPromo(d: any): PromoCode {
  return {
    id: d.id,
    code: d.code ?? "",
    description: d.description ?? "",
    percentOff: d.type === "percentage" ? Number(d.amount) : null,
    status: d.status ?? "unknown",
    enabledForCheckout: !!d.enabled_for_checkout,
    timesUsed: Number(d.times_used ?? 0),
    expiresAt: d.expires_at ?? null,
  };
}

/** Public: check a promo code before checkout so bad codes fail fast. */
export const validatePromoCode = createServerFn({ method: "GET" })
  .inputValidator((data: { code: string; environment: "sandbox" | "live" }) => data)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase();
    if (!code) return { valid: false as const };
    const { paddleFetchCached } = await import("@/lib/paddle.server");
    const res = await paddleFetchCached(data.environment, `/discounts?status=active&per_page=100`);
    const match = (res?.data ?? []).find(
      (d: any) => String(d?.code ?? "").toUpperCase() === code && d?.enabled_for_checkout,
    );
    if (!match) return { valid: false as const };
    return { valid: true as const, promo: toPromo(match) };
  });

/** Admin-only: every promo code configured for this environment. */
export const listPromoCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: "sandbox" | "live" }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Promo codes are restricted to admins.");
    const { paddleFetch } = await import("@/lib/paddle.server");
    const res = await paddleFetch(data.environment, `/discounts?status=active,archived&per_page=100`);
    return ((res?.data ?? []) as any[]).map(toPromo);
  });
