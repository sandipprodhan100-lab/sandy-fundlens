import { useEffect, useState } from "react";
import { redirect } from "@tanstack/react-router";
import { FEATURES } from "@/lib/app-edition";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlans } from "@/components/UpgradeCta";
import { useSession } from "@/lib/auth";
import { usePaddleCheckout } from "@/lib/paddle";
import { getPaddleEnvironment } from "@/lib/paddle";
import {
  DEFAULT_PROMO_CODE,
  getTopups,
  validatePromoCode,
  type Plan,
  type PlanId,
} from "@/lib/payments.functions";
import { FREE_DAILY_TURNS, PRO_DAILY_TURNS } from "@/lib/analyst-limits";
import { useQuery } from "@tanstack/react-query";

const COUPON_KEY = "mflens-coupon";

export const Route = createFileRoute("/pricing")({
  beforeLoad: () => {
    if (!FEATURES.pricing) throw redirect({ to: "/" });
  },
  // Server-rendered so crawlers (and users on slow devices) see the plans;
  // every browser-only call on this page already lives inside an effect.
  head: () => ({
    meta: [
      { title: "Pricing — MF Lens Pro" },
      {
        name: "description",
        content:
          "MF Lens pricing: a free sideways-market demo, or Pro monthly and annual plans with every window, holdings, manager profiles and PDF reports.",
      },
      { property: "og:title", content: "Pricing — MF Lens Pro" },
      {
        property: "og:description",
        content:
          "Choose MF Lens Pro monthly or annual and unlock the full sideways-market fund analysis.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://mutualfundlens.lovable.app/og-cover.png" },
      { name: "twitter:image", content: "https://mutualfundlens.lovable.app/og-cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://mutualfundlens.lovable.app/pricing" }],
  }),

  component: PricingPage,
});

const PRO_FEATURES = [
  `${PRO_DAILY_TURNS} AI analyst questions a day (free tier gets ${FREE_DAILY_TURNS})`,
  "Top-up packs for extra analyst questions any time",
  "Every detected sideways window, not just the latest",
  "All five categories with custom date ranges",
  "Top-10 holdings for each ranked fund",
  "Fund manager profile and career history",
  "Sharpe / Sortino / Treynor ratio deep-dive",
  "3×3 size-vs-style grid and category AUM stats",
  "PDF report download",
];

function PricingPage() {
  const [coupon, setCoupon] = useState("");
  const { session } = useSession();
  const navigate = useNavigate();
  const { data: plans, isLoading } = usePlans();
  const { openCheckout, loading } = usePaddleCheckout();

  // Keep a typed promo code across the sign-in round trip.
  useEffect(() => {
    const stored = sessionStorage.getItem(COUPON_KEY);
    // Site-wide promotion is pre-filled for everyone until it is deactivated.
    setCoupon(stored || DEFAULT_PROMO_CODE);
  }, []);
  useEffect(() => {
    const code = coupon.trim().toUpperCase();
    if (code) sessionStorage.setItem(COUPON_KEY, code);
    else sessionStorage.removeItem(COUPON_KEY);
  }, [coupon]);

  const code = coupon.trim().toUpperCase();
  const couponCheck = useQuery({
    queryKey: ["promo", code],
    enabled: code.length >= 3,
    staleTime: 1000 * 60 * 5,
    queryFn: () => validatePromoCode({ data: { code, environment: getPaddleEnvironment() } }),
  });

  const topups = useQuery({
    queryKey: ["topups", getPaddleEnvironment()],
    staleTime: 5 * 60 * 1000,
    queryFn: () => getTopups({ data: { environment: getPaddleEnvironment() } }),
  });

  const monthly = plans?.find((p: Plan) => p.priceId === "funslense_pro_monthly");
  const annual = plans?.find((p: Plan) => p.priceId === "funslense_pro_annual");

  const percentOff = couponCheck.data?.valid ? (couponCheck.data.promo?.percentOff ?? 0) : 0;
  const money = (plan: Plan | undefined, minor: number) =>
    plan
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: plan.currency,
          maximumFractionDigits: 0,
        }).format(minor / 100)
      : "—";
  const afterDiscount = (plan: Plan | undefined) =>
    plan && percentOff > 0 ? money(plan, plan.amount * (1 - percentOff / 100)) : null;
  // Annual vs 12 monthly payments, as a plain saving line.
  const annualSaving =
    monthly && annual && monthly.amount * 12 > annual.amount
      ? money(annual, monthly.amount * 12 - annual.amount)
      : null;


  const buy = (priceId: PlanId | string) => {
    if (!session?.user) {
      void navigate({ to: "/login", search: { next: "/pricing" } });
      return;
    }
    void openCheckout({
      priceId,
      userId: session.user.id,
      ...(session.user.email ? { customerEmail: session.user.email } : {}),
      ...(couponCheck.data?.valid ? { discountCode: code } : {}),
      successUrl: `${window.location.origin}/analysis?checkout=success`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">MF Lens pricing</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            Start free with one live sideways window per category. Upgrade for the full history,
            holdings, manager intelligence and exportable reports.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Have a promo code? Enter it below — it is applied automatically at checkout.
          </p>
          <div className="mx-auto mt-3 flex max-w-xs flex-col items-center gap-2 sm:flex-row">
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Promo code"
              className="h-9 w-full text-center font-mono uppercase sm:flex-1"
              aria-label="Promo code"
            />
            {code.length >= 3 && couponCheck.isFetching && (
              <span className="text-xs text-muted-foreground">checking…</span>
            )}
            {code.length >= 3 && !couponCheck.isFetching && couponCheck.data?.valid && (
              <span className="text-xs text-primary">
                {couponCheck.data.promo?.percentOff}% off applied
              </span>
            )}
            {code.length >= 3 && !couponCheck.isFetching && couponCheck.data?.valid === false && (
              <span className="text-xs text-destructive">invalid code</span>
            )}
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 md:grid-cols-3">

          <div className="panel flex flex-col p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Free demo</h2>
            <p className="mt-2 text-2xl font-semibold">₹0</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No card needed · latest window, all categories
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> Most recent sideways window
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> Top 5 ranked funds
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> Fund vs benchmark chart
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> {FREE_DAILY_TURNS} AI
                analyst questions a day
              </li>
            </ul>
            <Button asChild variant="outline" className="mt-auto pt-0" size="sm">
              <Link to="/">Open demo</Link>
            </Button>
          </div>

          <div className="panel flex flex-col p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Pro Monthly</h2>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-2xl font-semibold">
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : afterDiscount(monthly) ? (
                <>
                  {afterDiscount(monthly)}{" "}
                  <span className="text-sm font-normal text-muted-foreground line-through">
                    {monthly?.formatted}
                  </span>
                </>
              ) : (
                (monthly?.formatted ?? "—")
              )}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Billed every month, cancel anytime{percentOff > 0 ? ` · ${percentOff}% off applied` : ""}
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="mt-6"
              disabled={loading || !monthly}
              onClick={() => buy("funslense_pro_monthly")}
            >
              Subscribe monthly
            </Button>
          </div>

          <div className="panel flex flex-col border-primary/50 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Pro Annual</h2>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Best value
              </span>
            </div>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-2xl font-semibold">
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : afterDiscount(annual) ? (
                <>
                  {afterDiscount(annual)}{" "}
                  <span className="text-sm font-normal text-muted-foreground line-through">
                    {annual?.formatted}
                  </span>
                </>
              ) : (
                (annual?.formatted ?? "—")
              )}
              <span className="text-sm font-normal text-muted-foreground">/year</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Billed once a year, cancel anytime
              {annualSaving ? ` · saves ${annualSaving} vs monthly` : ""}
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-6"
              disabled={loading || !annual}
              onClick={() => buy("funslense_pro_annual")}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null} Subscribe yearly
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Both Pro plans include exactly the same features — only the billing cycle differs. Prices
          are in Indian rupees; any applicable taxes are shown at checkout. Subscriptions renew
          automatically until cancelled from your account page, and cancelling keeps access until
          the end of the paid period.
        </p>


        <div className="panel mt-8 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Analyst top-up packs</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pro includes {PRO_DAILY_TURNS} AI analyst questions per day. Need more on a busy day? Buy
            a one-time pack — the questions never expire and are used only after the daily
            allowance runs out.
          </p>
          <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
            {(topups.data ?? []).map((t) => (
              <Button
                key={t.priceId}
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => buy(t.priceId)}
              >
                {t.questions} extra questions · {t.formatted}
              </Button>
            ))}
            {topups.isLoading && (
              <span className="text-xs text-muted-foreground">loading packs…</span>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Already subscribed?{" "}
          <Link to="/account" className="text-primary underline">
            Manage your billing
          </Link>
          . MF Lens is research software, not investment advice.
        </p>
      </div>
    </div>
  );
}
