import { redirect } from "@tanstack/react-router";
import { FEATURES } from "@/lib/app-edition";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, MessageSquarePlus, Trash2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthStatus } from "@/components/AuthStatus";
import { AnalystQuota } from "@/components/analyst/AnalystQuota";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { TRIAL_THREAD_ID } from "@/lib/anon-session";
import { TRIAL_ANALYST_TURNS } from "@/lib/app-edition";

export const Route = createFileRoute("/analyst/")({
  beforeLoad: () => {
    if (!FEATURES.analyst) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "MF Lens Analyst — AI fund analysis agent" },
      {
        name: "description",
        content:
          "Ask the MF Lens Analyst about Indian mutual funds. Every figure comes from the MF Lens engine: sideways windows, alpha, Sharpe, drawdown and fund size.",
      },
      { property: "og:title", content: "MF Lens Analyst — AI fund analysis agent" },
      {
        property: "og:description",
        content: "An AI analyst that answers with numbers from the MF Lens analysis engine.",
      },
    ],
  }),
  component: AnalystHome,
});

type Thread = { id: string; title: string; updated_at: string };
type Digest = { id: string; category: string; headline: string; body: string; digest_date: string };

const CATEGORY_LABEL: Record<string, string> = {
  large: "Large Cap",
  mid: "Mid Cap",
  small: "Small Cap",
  multi: "Multi Cap",
  flexi: "Flexi Cap",
  hybrid: "Aggressive Hybrid",
};

function AnalystHome() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const threads = useQuery({
    queryKey: ["agent-threads", session?.user.id ?? null],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_threads")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Thread[];
    },
  });

  const digests = useQuery({
    queryKey: ["agent-digests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_digests")
        .select("id,category,headline,body,digest_date")
        .order("digest_date", { ascending: false })
        .limit(6);
      if (error) throw new Error(error.message);
      return (data ?? []) as Digest[];
    },
  });

  async function newThread() {
    if (!session) {
      void navigate({ to: "/analyst/$threadId", params: { threadId: TRIAL_THREAD_ID } });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("agent_threads")
      .insert({ user_id: session.user.id, title: "New analysis" })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not start a conversation");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["agent-threads"] });
    void navigate({ to: "/analyst/$threadId", params: { threadId: data.id } });
  }

  async function removeThread(id: string) {
    const { error } = await supabase.from("agent_threads").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["agent-threads"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> MF Lens
          </Link>
          <div className="flex items-center gap-4">
            {FEATURES.pricing ? (
              <Link to="/pricing" className="text-sm text-foreground/70 hover:text-foreground">
                Pricing
              </Link>
            ) : null}
            <AuthStatus />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <AnalystQuota />
        </div>
        <header className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
            <Bot className="h-7 w-7 text-primary" /> MF Lens Analyst
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            An AI agent that answers with numbers pulled live from the MF Lens engine — sideways
            windows, alpha, Sharpe/Sortino/Treynor, drawdown behaviour, fund size and holdings. It
            never invents a figure; if a source is unavailable it says so.
          </p>
          <div className="mt-5">
            <Button onClick={newThread} disabled={creating || loading}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              {session ? "New analysis" : `Try ${TRIAL_ANALYST_TURNS} free questions`}
            </Button>
            {session ? null : (
              <p className="mt-2 text-xs text-muted-foreground">
                You get {TRIAL_ANALYST_TURNS} analyst questions in this browser session without an
                account. Sign in with Google or a mobile OTP to unlock the Pro features — saved
                conversations, holdings, manager profiles, combined ranking and dip radar.
              </p>
            )}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Your conversations
            </h2>
            {!session ? (
              <p className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                Sign in to keep your analyses.
              </p>
            ) : threads.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (threads.data ?? []).length === 0 ? (
              <p className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                No conversations yet. Start one to ask about a category, a window or a specific fund.
              </p>
            ) : (
              <ul className="space-y-2">
                {(threads.data ?? []).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <Link
                      to="/analyst/$threadId"
                      params={{ threadId: t.id }}
                      className="min-w-0 flex-1"
                    >
                      <span className="block truncate text-sm font-medium text-foreground">
                        {t.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.updated_at).toLocaleString()}
                      </span>
                    </Link>
                    <button
                      aria-label="Delete conversation"
                      onClick={() => void removeThread(t.id)}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Daily agent digest
            </h2>
            {(digests.data ?? []).length === 0 ? (
              <p className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                The scheduled agent publishes a per-category digest here once it has run.
              </p>
            ) : (
              <ul className="space-y-3">
                {(digests.data ?? []).map((d) => (
                  <li key={d.id} className="rounded-lg border border-border/60 p-4">
                    <div className="text-xs uppercase tracking-wide text-primary">
                      {CATEGORY_LABEL[d.category] ?? d.category} · {d.digest_date}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-foreground">{d.headline}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{d.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
