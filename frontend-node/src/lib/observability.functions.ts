import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ObservabilitySnapshot = {
  analyst: { turnsToday: number; turns7d: number; activeUsers7d: number; threads: number };
  daily: { date: string; turns: number; users: number }[];
  billing: {
    activeSubscriptions: number;
    subsByPlan: { plan: string; count: number }[];
    purchases30d: number;
    revenue30d: number;
    currency: string;
  };
  credits: { sold: number; used: number };
  cache: { rows: number; live: number };
};

/** Admin-only operations snapshot: analyst usage, billing and cache health. */
export const getObservability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ObservabilitySnapshot> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("The observability dashboard is restricted to admins.");


    const { getServerPaddleEnvironment } = await import("@/lib/paddle.server");
    const env = getServerPaddleEnvironment();

    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [usage, threads, subs, purchases, credits, cache] = await Promise.all([
      supabaseAdmin
        .from("agent_usage")
        .select("user_id,usage_date,turns")
        .gte("usage_date", since),
      supabaseAdmin.from("agent_threads").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("status,price_id").eq("environment", env),
      supabaseAdmin
        .from("purchases")
        .select("amount,currency,status,created_at")
        .eq("environment", env)
        .gte("created_at", since30),
      supabaseAdmin.from("agent_credits").select("credits,used"),
      supabaseAdmin.from("analysis_cache").select("expires_at"),
    ]);

    const rows = usage.data ?? [];
    const byDate = new Map<string, { turns: number; users: Set<string> }>();
    for (const r of rows) {
      const entry = byDate.get(r.usage_date) ?? { turns: 0, users: new Set<string>() };
      entry.turns += r.turns ?? 0;
      entry.users.add(r.user_id);
      byDate.set(r.usage_date, entry);
    }
    const daily = [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, turns: v.turns, users: v.users.size }));

    const subRows = (subs.data ?? []).filter((s) =>
      ["active", "trialing", "past_due"].includes(s.status),
    );
    const planCounts = new Map<string, number>();
    for (const s of subRows) planCounts.set(s.price_id, (planCounts.get(s.price_id) ?? 0) + 1);

    const paid = (purchases.data ?? []).filter((p) => p.status !== "refunded");
    const nowIso = new Date().toISOString();

    return {
      analyst: {
        turnsToday: rows.filter((r) => r.usage_date === today).reduce((a, r) => a + r.turns, 0),
        turns7d: rows.reduce((a, r) => a + r.turns, 0),
        activeUsers7d: new Set(rows.map((r) => r.user_id)).size,
        threads: threads.count ?? 0,
      },
      daily,
      billing: {
        activeSubscriptions: subRows.length,
        subsByPlan: [...planCounts.entries()].map(([plan, count]) => ({ plan, count })),
        purchases30d: paid.length,
        revenue30d: paid.reduce((a, p) => a + (p.amount ?? 0), 0) / 100,
        currency: paid[0]?.currency ?? "INR",
      },
      credits: {
        sold: (credits.data ?? []).reduce((a, c) => a + (c.credits ?? 0), 0),
        used: (credits.data ?? []).reduce((a, c) => a + (c.used ?? 0), 0),
      },
      cache: {
        rows: (cache.data ?? []).length,
        live: (cache.data ?? []).filter((c) => c.expires_at > nowIso).length,
      },
    };
  });
