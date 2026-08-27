import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAnalystUsage } from "@/lib/analyst-usage.functions";
import { getPaddleEnvironment, usePaddleCheckout } from "@/lib/paddle";
import { getTopups } from "@/lib/payments.functions";
import { useSession } from "@/lib/auth";

/** Shows today's analyst allowance and lets Pro users buy extra questions. */
export function AnalystQuota() {
  const { session } = useSession();
  const { openCheckout, loading } = usePaddleCheckout();

  const usage = useQuery({
    queryKey: ["analyst-usage"],
    enabled: !!session,
    staleTime: 30_000,
    queryFn: () => getAnalystUsage(),
  });

  const topups = useQuery({
    queryKey: ["topups", getPaddleEnvironment()],
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
    queryFn: () => getTopups({ data: { environment: getPaddleEnvironment() } }),
  });

  if (!session || !usage.data) return null;
  const u = usage.data;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="size-3.5 text-primary" />
          <span className="num font-semibold text-foreground">
            {u.dailyRemaining}/{u.cap}
          </span>{" "}
          analyst questions left today
          {u.creditsRemaining > 0 && (
            <>
              {" "}
              · <span className="num font-semibold text-foreground">{u.creditsRemaining}</span>{" "}
              top-up questions in reserve
            </>
          )}
          {!u.isPro && (
            <>
              {" "}
              ·{" "}
              <Link to="/pricing" className="text-primary underline">
                Pro gets more
              </Link>
            </>
          )}
        </p>
        {u.isPro && (
          <div className="flex flex-wrap gap-2">
            {(topups.data ?? []).map((t) => (
              <Button
                key={t.priceId}
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() =>
                  void openCheckout({
                    priceId: t.priceId,
                    userId: session.user.id,
                    ...(session.user.email ? { customerEmail: session.user.email } : {}),
                    successUrl: `${window.location.origin}/analyst?topup=success`,
                  })
                }
              >
                +{t.questions} for {t.formatted}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
