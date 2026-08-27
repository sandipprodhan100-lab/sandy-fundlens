import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth";
import { getPaddleEnvironment } from "@/lib/paddle";
import { createPortalSession, getBillingOverview } from "@/lib/payments.functions";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Account & Billing — MF Lens" },
      {
        name: "description",
        content:
          "View your MF Lens plan, payment history, receipts and manage or cancel your Pro subscription.",
      },
      { property: "og:title", content: "Account & Billing — MF Lens" },
      {
        property: "og:description",
        content: "Manage your MF Lens Pro plan, receipts and subscription.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount / 100);
  } catch {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  }
};

const day = (v: string | null) => (v ? new Date(v).toLocaleDateString("en-IN") : "—");

function AccountPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const environment = getPaddleEnvironment();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/login", search: { next: "/account" }, replace: true });
    }
  }, [loading, session, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["billing", environment, session?.user?.id],
    queryFn: () => getBillingOverview({ data: { environment } }),
    enabled: !!session,
  });

  const openPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const url = await createPortalSession({ data: { environment } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const subscription = data?.subscriptions?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Account & billing</h1>
            <p className="mt-1 text-xs text-muted-foreground">{session?.user?.email ?? ""}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/storage">Data lake</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/analysis">Back to analysis</Link>
            </Button>
          </div>

        </header>

        {isLoading ? (
          <div className="panel mt-6 flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your billing details…
          </div>
        ) : (
          <>
            <section className="panel mt-6 p-6">
              <h2 className="text-sm font-semibold">Current plan</h2>
              {data?.isPro ? (
                <p className="mt-2 text-sm">
                  <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    {data?.isAdmin ? "Admin — full access" : "FunsLensePro active"}
                  </span>
                  {data?.isAdmin ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Your account has the admin role, so every Pro feature is unlocked without a
                      subscription.
                    </span>
                  ) : null}

                  {subscription ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {subscription.price_id === "funslense_pro_annual"
                        ? "Annual"
                        : subscription.price_id === "funslense_pro_3year"
                          ? "3-Year"
                          : "Subscription"}{" "}
                      · status {subscription.status} ·{" "}
                      {subscription.cancel_at_period_end ? "ends" : "renews"}{" "}
                      {day(subscription.current_period_end)}
                    </span>
                  ) : data?.isAdmin ? null : (
                    <span className="ml-2 text-xs text-muted-foreground">
                      One-time purchase — no renewal needed
                    </span>
                  )}

                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  You're on the free plan.{" "}
                  <Link to="/pricing" className="text-primary underline">
                    See Pro plans
                  </Link>
                  .
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={portalLoading} onClick={openPortal}>
                  {portalLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ExternalLink className="size-4" />
                  )}
                  Manage billing & invoices
                </Button>
                {!data?.isPro ? (
                  <Button asChild size="sm">
                    <Link to="/pricing">Upgrade</Link>
                  </Button>
                ) : null}
              </div>
              {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
            </section>

            <section className="panel mt-4 p-6">
              <h2 className="text-sm font-semibold">Payment history</h2>
              {data?.purchases?.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground">
                      <tr className="text-left">
                        <th className="py-2">Date</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.purchases.map((p: any) => (
                        <tr key={p.id} className="border-t border-border/60">
                          <td className="py-2">{day(p.created_at)}</td>
                          <td>{p.price_id}</td>
                          <td>{money(Number(p.amount), p.currency)}</td>
                          <td className="capitalize">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No payments yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
