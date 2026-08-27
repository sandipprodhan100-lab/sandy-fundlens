import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPaddleEnvironment, usePaddleCheckout } from "@/lib/paddle";
import { getPlans, type Plan, type PlanId } from "@/lib/payments.functions";

export function usePlans() {
  const environment = getPaddleEnvironment();
  return useQuery({
    queryKey: ["plans", environment],
    queryFn: () => getPlans({ data: { environment } }),
    staleTime: 5 * 60 * 1000,
  });
}

export function UpgradeCta({
  userId,
  customerEmail,
  size = "default",
}: {
  userId: string;
  customerEmail?: string | undefined;
  size?: "default" | "sm";
}) {
  const { openCheckout, loading } = usePaddleCheckout();
  const { data: plans } = usePlans();

  const annual = plans?.find((p: Plan) => p.priceId === "funslense_pro_annual");
  const monthly = plans?.find((p: Plan) => p.priceId === "funslense_pro_monthly");

  const buy = (priceId: PlanId) =>
    openCheckout({
      priceId,
      userId,
      ...(customerEmail ? { customerEmail } : {}),
      successUrl: `${window.location.origin}/analysis?checkout=success`,
    });

  return (
    <div className="panel mt-6 flex flex-col items-start gap-3 border-dashed border-primary/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="size-4 text-primary" /> Unlock FunsLensePro
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Every sideways window across all categories, top-10 holdings, manager profiles, ratio
          deep-dive and PDF reports. Promo code <span className="font-mono">LAUNCH50</span> takes
          50% off at checkout.
        </p>
        <Link to="/pricing" className="mt-1 inline-block text-xs text-primary underline">
          Compare plans
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size={size} disabled={loading || !annual} onClick={() => buy("funslense_pro_annual")}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {annual ? `${annual.formatted}/year` : "Annual"}
        </Button>
        <Button
          size={size}
          variant="outline"
          disabled={loading || !monthly}
          onClick={() => buy("funslense_pro_monthly")}
        >
          {monthly ? `${monthly.formatted}/month` : "Monthly"}
        </Button>
      </div>
    </div>
  );
}
