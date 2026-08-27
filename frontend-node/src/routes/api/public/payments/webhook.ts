import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { verifyWebhook, type PaddleEnv } from "@/lib/paddle.server";
import type { Database } from "@/integrations/supabase/types";

type SupabaseClient = ReturnType<typeof createClient<Database>>;
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!
    );
  }
  return _supabase;
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const { id, customerId, items, customData, details, subscriptionId } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData");
    return;
  }

  const item = items?.[0];
  if (!item) {
    console.error("No items in transaction");
    return;
  }

  const priceId = item.price?.importMeta?.externalId || item.price?.id;
  const productId = item.product?.importMeta?.externalId || item.price?.productId || "";
  const amount = Number(details?.totals?.total || item.price?.unitPrice?.amount || 0);
  const currency =
    details?.totals?.currencyCode || item.price?.unitPrice?.currencyCode || "INR";

  await getSupabase()
    .from("purchases")
    .upsert(
      {
        user_id: userId,
        paddle_customer_id: customerId,
        paddle_transaction_id: id,
        paddle_order_id: details?.orderId || null,
        product_id: productId,
        price_id: priceId,
        // Recurring charges are tracked as receipts; entitlement comes from the
        // subscription row so a refund/cancel revokes access correctly.
        status: subscriptionId ? "receipt" : "completed",
        amount,
        currency,
        environment: env,
        metadata: { ...customData, subscription_id: subscriptionId ?? null, paddle_item: item },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_transaction_id" }
    );

  // Analyst top-up packs grant extra AI questions on top of the daily quota.
  const { PACK_CREDITS } = await import("@/lib/analyst-limits");
  const packQuestions = PACK_CREDITS[priceId as string];
  if (packQuestions) {
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from("agent_credits")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();
    await supabase.from("agent_credits").upsert(
      {
        user_id: userId,
        credits: (existing?.credits ?? 0) + packQuestions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }
}

async function handleSubscriptionUpsert(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData, scheduledChange } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in subscription customData", id);
    return;
  }
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId || item?.price?.id || "";
  const productId = item?.product?.importMeta?.externalId || item?.price?.productId || "";

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: id,
        paddle_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status,
        current_period_start: currentBillingPeriod?.startsAt ?? null,
        current_period_end: currentBillingPeriod?.endsAt ?? null,
        cancel_at_period_end: scheduledChange?.action === "cancel",
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" }
    );
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

/** Refund or chargeback: revoke access immediately. */
async function handleAdjustment(data: any, env: PaddleEnv) {
  const action = data?.action; // refund | chargeback | credit
  const status = data?.status; // pending_approval | approved | rejected | reversed
  if (!["refund", "chargeback", "chargeback_warning"].includes(action)) return;
  if (status === "rejected" || status === "reversed") return;

  const supabase = getSupabase();
  const transactionId = data?.transactionId;
  const subscriptionId = data?.subscriptionId;

  if (transactionId) {
    await supabase
      .from("purchases")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("paddle_transaction_id", transactionId)
      .eq("environment", env);
  }

  if (subscriptionId) {
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscriptionId)
      .eq("environment", env);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.eventType) {
            case "transaction.completed":
              await handleTransactionCompleted(event.data, env);
              break;
            case "subscription.created":
            case "subscription.updated":
            case "subscription.activated":
            case "subscription.resumed":
            case "subscription.paused":
              await handleSubscriptionUpsert(event.data, env);
              break;
            case "subscription.canceled":
              await handleSubscriptionCanceled(event.data, env);
              break;
            case "adjustment.created":
            case "adjustment.updated":
              await handleAdjustment(event.data, env);
              break;
            case "transaction.payment_failed":
              console.warn("Payment failed", event.data?.id);
              break;
            default:
              console.log("Unhandled event:", event.eventType);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
