import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, CheckCircle2, Database, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Account & Analytics Usage — MF Lens" },
      {
        name: "description",
        content: "View your account status, query usage, and explore MF Lens Pro capabilities.",
      },
      { property: "og:title", content: "Account & Analytics Usage — MF Lens" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/login", search: { next: "/account" }, replace: true });
    }
  }, [loading, session, navigate]);

  const userEmail = session?.user?.email?.toLowerCase() ?? "";
  const isAdmin =
    userEmail === "sandipprodhan100@gmail.com" ||
    userEmail === "sandeepprodhan100@gmail.com" ||
    userEmail === "sandip.prodhan@pabtechnologies.com";

  // Query usage counts for user
  const usageQuery = useQuery({
    queryKey: ["user-usage-count", session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      if (!session) return { totalQueries: 0, threadsCount: 0 };
      const [usageRes, threadsRes] = await Promise.all([
        supabase.from("agent_usage").select("turns").eq("user_id", session.user.id),
        supabase.from("agent_threads").select("id", { count: "exact" }).eq("user_id", session.user.id),
      ]);
      const totalTurns = (usageRes.data ?? []).reduce((sum, r) => sum + (Number(r.turns) || 0), 0);
      return {
        totalQueries: totalTurns,
        threadsCount: threadsRes.count ?? (threadsRes.data?.length ?? 0),
      };
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account & Usage</h1>
            <p className="mt-1 text-sm text-slate-600 font-mono">{userEmail || "Signed In"}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="cursor-pointer bg-white">
              <Link to="/analysis">Back to Terminal</Link>
            </Button>
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
              <Link to="/analyst">Open AI Analyst</Link>
            </Button>
          </div>
        </header>

        {/* User Status & Activity Metrics */}
        <section className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Access Tier</span>
            <div className="flex items-center gap-2 pt-1">
              {isAdmin ? (
                <>
                  <ShieldCheck className="size-5 text-indigo-600 shrink-0" />
                  <span className="text-base font-bold text-slate-900">Super Admin</span>
                </>
              ) : (
                <>
                  <Bot className="size-5 text-emerald-600 shrink-0" />
                  <span className="text-base font-bold text-slate-900">Standard Access</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              {isAdmin ? "Unlimited queries & full pipeline access" : "Grounded queries with Delta Lake tools"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Queries Run</span>
            <div className="flex items-center gap-2 pt-1">
              <Zap className="size-5 text-amber-500 shrink-0" />
              <span className="text-2xl font-black text-slate-900">
                {usageQuery.data?.totalQueries ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">Real-time analytical questions processed</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Threads</span>
            <div className="flex items-center gap-2 pt-1">
              <Database className="size-5 text-blue-600 shrink-0" />
              <span className="text-2xl font-black text-slate-900">
                {usageQuery.data?.threadsCount ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">Saved research conversations in S3</p>
          </div>
        </section>

        {/* MF Lens Pro Advertisement Showcase */}
        <section className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
                <Sparkles className="size-3.5" /> MF Lens Pro & Enterprise
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Advanced AI Research & Institutional Quantitative Tools
              </h2>
            </div>
            <Button
              asChild
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
            >
              <a href="https://sandipprodhan.in/#consultation" target="_blank" rel="noopener noreferrer">
                Request Pro / Enterprise Access
              </a>
            </Button>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            MF Lens Pro is built for wealth managers, quant analysts, and institutional teams who require high-frequency sideways market detection, custom fund mandates, and direct S3 Parquet delta lake integrations.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            {[
              {
                title: "Live Sideways Market Radar",
                desc: "Real-time automated regime classification across 24 Category × Benchmark combinations with instant change alerts.",
              },
              {
                title: "Institutional Manager Track Records",
                desc: "10-year longitudinal manager history, cross-fund tenure analytics, and scheme alpha attribution.",
              },
              {
                title: "Automated Rebalancing Engine",
                desc: "Algorithmic model portfolio stress testing with custom Sharpe, Sortino, and downside risk constraints.",
              },
              {
                title: "Direct Data Lake & API Feeds",
                desc: "REST and MCP tool integration hooking your private internal models directly into the AWS S3 Delta Lake repository.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/70">
                <CheckCircle2 className="size-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
