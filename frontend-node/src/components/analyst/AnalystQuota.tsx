import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bot, Sparkles, Zap } from "lucide-react";

import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

/** Shows real-time query count and highlights Pro features. */
export function AnalystQuota() {
  const { session } = useSession();

  const userEmail = session?.user?.email?.toLowerCase() ?? "";
  const isAdmin =
    userEmail === "sandipprodhan100@gmail.com" ||
    userEmail === "sandeepprodhan100@gmail.com" ||
    userEmail === "sandip.prodhan@pabtechnologies.com";

  const usageQuery = useQuery({
    queryKey: ["user-analyst-usage", session?.user?.id],
    enabled: !!session,
    staleTime: 10_000,
    queryFn: async () => {
      if (!session) return { totalQueries: 0 };
      const { data } = await supabase
        .from("agent_usage")
        .select("turns")
        .eq("user_id", session.user.id);
      const total = (data ?? []).reduce((sum, r) => sum + (Number(r.turns) || 0), 0);
      return { totalQueries: total };
    },
  });

  if (!session) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Zap className="size-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-slate-900">
            {isAdmin ? "Super Admin (Unlimited Access)" : `Queries Run: ${usageQuery.data?.totalQueries ?? 0}`}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Grounded on S3 Delta Lake AMFI Data</span>
        </div>

        <Link
          to="/account"
          className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Sparkles className="size-3.5" /> Explore Pro & Enterprise Features →
        </Link>
      </div>
    </div>
  );
}
