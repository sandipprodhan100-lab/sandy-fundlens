import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FREE_DAILY_TURNS, PRO_DAILY_TURNS } from "@/lib/analyst-limits";

export type AnalystUsage = {
  isPro: boolean;
  used: number;
  cap: number;
  dailyRemaining: number;
  credits: number;
  creditsRemaining: number;
  totalRemaining: number;
};

/** Authenticated: today's analyst usage plus any purchased top-up balance. */
export const getAnalystUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalystUsage> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getServerPaddleEnvironment } = await import("@/lib/paddle.server");
    const today = new Date().toISOString().slice(0, 10);

    const [pro, usage, credits] = await Promise.all([
      supabaseAdmin.rpc("has_pro_access", {
        user_uuid: context.userId,
        check_env: getServerPaddleEnvironment(),
      }),
      context.supabase
        .from("agent_usage")
        .select("turns")
        .eq("user_id", context.userId)
        .eq("usage_date", today)
        .maybeSingle(),
      context.supabase
        .from("agent_credits")
        .select("credits,used")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);

    const isPro = !!pro.data;
    const cap = isPro ? PRO_DAILY_TURNS : FREE_DAILY_TURNS;
    const used = usage.data?.turns ?? 0;
    const bought = credits.data?.credits ?? 0;
    const spent = credits.data?.used ?? 0;
    const creditsRemaining = Math.max(0, bought - spent);
    const dailyRemaining = Math.max(0, cap - used);

    return {
      isPro,
      used,
      cap,
      dailyRemaining,
      credits: bought,
      creditsRemaining,
      totalRemaining: dailyRemaining + creditsRemaining,
    };
  });
