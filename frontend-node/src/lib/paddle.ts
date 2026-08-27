import { useState } from "react";
import { toast } from "sonner";

import { resolvePaddlePrice } from "@/lib/payments.functions";

export type PaddleEnv = "sandbox" | "live";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];

export function getPaddleEnvironment(): PaddleEnv {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

let paddleInitialized = false;

export async function initializePaddle() {
  if (paddleInitialized) return;
  if (!clientToken) throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      const paddleJsEnvironment = getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(paddleJsEnvironment);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const priceIdCache = new Map<string, string>();

export async function getPaddlePriceId(priceId: string): Promise<string> {
  if (priceId.startsWith("pri_")) return priceId;
  const environment = getPaddleEnvironment();
  const cacheKey = `${environment}:${priceId}`;
  const cached = priceIdCache.get(cacheKey);
  if (cached) return cached;
  const resolved = await resolvePaddlePrice({ data: { priceId, environment } });
  priceIdCache.set(cacheKey, resolved);
  return resolved;
}


export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    priceId: string;
    userId: string;
    customerEmail?: string | undefined;
    discountCode?: string | undefined;
    successUrl?: string;
  }) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: { userId: options.userId },
        ...(options.discountCode ? { discountCode: options.discountCode } : {}),
        settings: {
          showAddDiscounts: true,
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/analysis?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not open checkout.";
      toast.error("Payment could not start", { description: message });
      console.error("[paddle] checkout failed", err);
    } finally {
      setLoading(false);
    }
  };



  return { openCheckout, loading };
}

declare global {
  interface Window {
    Paddle: any;
  }
}
