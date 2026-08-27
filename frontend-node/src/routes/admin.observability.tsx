import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CreditCard, Database, Loader2, MessageSquare } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AuthStatus } from "@/components/AuthStatus";
import { getObservability } from "@/lib/observability.functions";

export const Route = createFileRoute("/admin/observability")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Observability — MF Lens admin" },
      {
        name: "description",
        content:
          "Operational dashboard for MF Lens: analyst usage, subscription mix, top-up credits and analysis cache health.",
      },
      { property: "og:title", content: "Observability — MF Lens admin" },
      {
        property: "og:description",
        content: "Analyst usage, billing and cache health for MF Lens operators.",
      },
    ],
  }),
  component: ObservabilityPage,
});

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) {
  return (
    <div className="panel p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </p>
      <p className="num mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ObservabilityPage() {
  const q = useQuery({
    queryKey: ["observability"],
    refetchInterval: 60_000,
    queryFn: () => getObservability(),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-semibold">
            MF Lens · admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/admin/storage" className="text-muted-foreground hover:text-foreground">
              Storage
            </Link>
            <AuthStatus />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Observability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live operational health: AI analyst consumption, subscription mix and cache efficiency.
          Refreshes every minute.
        </p>

        {q.isPending && (
          <div className="panel mt-6 flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Collecting metrics…
          </div>
        )}
        {q.isError && (
          <div className="panel mt-6 p-6 text-sm text-destructive">
            {(q.error as Error).message}
          </div>
        )}

        {q.data && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Analyst turns today" value={q.data.analyst.turnsToday} icon={Activity} />
              <Stat label="Turns · last 7 days" value={q.data.analyst.turns7d} icon={MessageSquare} />
              <Stat label="Active analysts · 7d" value={q.data.analyst.activeUsers7d} icon={MessageSquare} />
              <Stat label="Conversations" value={q.data.analyst.threads} icon={MessageSquare} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Active subscriptions"
                value={q.data.billing.activeSubscriptions}
                icon={CreditCard}
              />
              <Stat
                label="Revenue · 30d"
                value={`${q.data.billing.currency} ${q.data.billing.revenue30d.toLocaleString("en-IN")}`}
                icon={CreditCard}
              />
              <Stat
                label="Top-up questions sold / used"
                value={`${q.data.credits.sold} / ${q.data.credits.used}`}
                icon={Activity}
              />
              <Stat
                label="Cache rows (live)"
                value={`${q.data.cache.rows} (${q.data.cache.live})`}
                icon={Database}
              />
            </div>

            <div className="panel p-5">
              <h2 className="eyebrow">Analyst turns · last 7 days</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.data.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="turns" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="eyebrow">Subscriptions by plan</h2>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {q.data.billing.subsByPlan.map((p) => (
                    <tr key={p.plan} className="border-b border-border/60">
                      <td className="py-2 font-mono text-xs">{p.plan}</td>
                      <td className="num py-2 text-right font-semibold">{p.count}</td>
                    </tr>
                  ))}
                  {q.data.billing.subsByPlan.length === 0 && (
                    <tr>
                      <td className="py-2 text-xs text-muted-foreground">No active subscriptions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
