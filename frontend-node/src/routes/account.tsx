import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, CheckCircle2, Database, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Account & Usage</h1>
            <p className="mt-1 text-sm text-muted-foreground font-mono">{userEmail || "Signed In"}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="cursor-pointer">
              <Link to="/analysis">Back to Terminal</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              <Link to="/analyst">Open AI Analyst</Link>
            </Button>
          </div>
        </header>

        {/* User Status & Activity Metrics */}
        <section className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Tier</span>
            <div className="flex items-center gap-2 pt-1">
              {isAdmin ? (
                <>
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span className="text-base font-bold text-foreground">Super Admin</span>
                </>
              ) : (
                <>
                  <Bot className="size-5 text-positive shrink-0" />
                  <span className="text-base font-bold text-foreground">Standard Access</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              {isAdmin ? "Unlimited queries & full pipeline access" : "Grounded queries with Delta Lake tools"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Queries Run</span>
            <div className="flex items-center gap-2 pt-1">
              <Zap className="size-5 text-amber-500 shrink-0" />
              <span className="text-2xl font-black text-foreground">
                {usageQuery.data?.totalQueries ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">Real-time analytical questions processed</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Threads</span>
            <div className="flex items-center gap-2 pt-1">
              <Database className="size-5 text-cyan-500 shrink-0" />
              <span className="text-2xl font-black text-foreground">
                {usageQuery.data?.threadsCount ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">Saved research conversations in S3</p>
          </div>
        </section>

        {/* MF Lens Pro Advertisement Showcase */}
        <section className="rounded-2xl border border-border bg-card p-7 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
                <Sparkles className="size-3.5" /> MF Lens Pro & Enterprise
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Advanced AI Research & Institutional Quantitative Tools
              </h2>
            </div>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer"
            >
              <a href="https://sandipprodhan.in/#contact" target="_blank" rel="noopener noreferrer">
                Request Pro / Enterprise Access
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
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
              <div key={idx} className="flex gap-3 p-4 rounded-xl border border-border/60 bg-background/50">
                <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
