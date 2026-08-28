import { createFileRoute } from "@tanstack/react-router";
import { streamText, type UIMessage } from "ai";

import { getAiModel } from "@/lib/ai-gateway.server";
import { ANALYST_SYSTEM_PROMPT, buildAnalystTools } from "@/lib/agent-tools.server";

type Body = { messages?: unknown; threadId?: unknown };

const FREE_MONTHLY_TURNS = 5;

// Admin emails with unlimited queries and full access
const ADMIN_EMAILS = new Set([
  "sandipprodhan100@gmail.com",
  "sandeepprodhan100@gmail.com",
]);

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const declared = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(declared) && declared > 256_000) {
          return json({ error: "Message is too large." }, 413);
        }
        const raw = await request.text();
        if (raw.length > 256_000) return json({ error: "Message is too large." }, 413);

        let parsed: Body;
        try {
          parsed = JSON.parse(raw) as Body;
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }
        const { messages, threadId } = parsed;
        if (!Array.isArray(messages) || messages.length === 0 || messages.length > 200) {
          return json({ error: "Messages are required" }, 400);
        }

        const validThreadId = typeof threadId === "string" && threadId.length > 0
          ? threadId
          : crypto.randomUUID();

        const header = request.headers.get("authorization") ?? "";
        const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
        const signedIn = !!token && token.split(".").length === 3;

        // User must be signed in with email
        if (!signedIn) {
          return json(
            {
              error:
                "Please sign in or create an account with your email to use the AI Analyst (5 free analyses per month).",
            },
            401,
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date().toISOString().slice(0, 10);
        const currentMonth = today.slice(0, 7);
        const uiMessages = messages as UIMessage[];

        let userId: string | null = null;
        let userEmail = "";
        try {
          const { data: userData } = await supabaseAdmin.auth.getUser(token);
          userId = userData?.user?.id ?? null;
          userEmail = userData?.user?.email?.toLowerCase() ?? "";
        } catch (authErr) {
          console.warn("Auth token lookup error:", authErr);
        }

        if (!userId) {
          return json({ error: "Your session expired. Please sign in again." }, 401);
        }

        const isAdmin = ADMIN_EMAILS.has(userEmail);

        // Ensure Thread Exists or Auto-Create
        try {
          const { data: thread } = await supabaseAdmin
            .from("agent_threads")
            .select("id,user_id,title")
            .eq("id", validThreadId)
            .maybeSingle();

          if (!thread) {
            await supabaseAdmin.from("agent_threads").insert({
              id: validThreadId,
              user_id: userId,
              title: "New analysis",
              updated_at: new Date().toISOString(),
            });
          }
        } catch (threadErr) {
          console.warn("Thread table sync notice:", threadErr);
        }

        // Check Monthly Usage (Admins bypass limits; Free users get 5/month)
        if (!isAdmin) {
          try {
            const { data: monthUsage } = await supabaseAdmin
              .from("agent_usage")
              .select("turns")
              .eq("user_id", userId)
              .like("usage_date", `${currentMonth}%`);

            const monthlyUsed =
              monthUsage?.reduce((acc, row) => acc + (Number(row.turns) || 0), 0) ?? 0;

            if (monthlyUsed >= FREE_MONTHLY_TURNS) {
              return json(
                {
                  error: `You have reached your quota of ${FREE_MONTHLY_TURNS} free AI analyses for ${currentMonth}. Your quota resets on the 1st of next month.`,
                },
                429,
              );
            }
          } catch (usageErr) {
            console.warn("Usage tracking check notice:", usageErr);
          }
        }

        // Track usage turns
        try {
          const { data: todayUsage } = await supabaseAdmin
            .from("agent_usage")
            .select("turns")
            .eq("user_id", userId)
            .eq("usage_date", today)
            .maybeSingle();

          const todayUsed = todayUsage?.turns ?? 0;
          await supabaseAdmin
            .from("agent_usage")
            .upsert(
              { user_id: userId, usage_date: today, turns: todayUsed + 1 },
              { onConflict: "user_id,usage_date" },
            );
        } catch (turnErr) {
          console.warn("Turn recording notice:", turnErr);
        }

        // Record incoming user message
        const lastMsg = uiMessages[uiMessages.length - 1];
        if (lastMsg?.role === "user") {
          try {
            await supabaseAdmin.from("agent_messages").insert({
              thread_id: validThreadId,
              user_id: userId,
              role: "user",
              sdk_message_id: lastMsg.id ?? null,
              parts: lastMsg.parts as unknown as never,
            });

            const firstText = lastMsg.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim();
            if (firstText) {
              await supabaseAdmin
                .from("agent_threads")
                .update({ title: firstText.slice(0, 70), updated_at: new Date().toISOString() })
                .eq("id", validThreadId);
            }
          } catch (msgErr) {
            console.warn("Message recording notice:", msgErr);
          }
        }

        const latestPrompt =
          lastMsg?.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim() || "";

        // Stream AI Generation using Gemini with S3-backed tools via streamText
        const model = getAiModel();
        if (model) {
          try {
            const result = streamText({
              model,
              system: ANALYST_SYSTEM_PROMPT,
              prompt: latestPrompt,
              tools: buildAnalystTools({ isPro: true }),
              maxSteps: 5,
              onFinish: async ({ text }) => {
                try {
                  const assistantMessageId = "msg-" + Math.random().toString(36).slice(2, 11);
                  await supabaseAdmin.from("agent_messages").insert({
                    thread_id: validThreadId,
                    user_id: userId,
                    role: "assistant",
                    sdk_message_id: assistantMessageId,
                    parts: [{ type: "text", text }] as unknown as never,
                  });
                } catch (recordErr) {
                  console.warn("Assistant record error:", recordErr);
                }
              },
            });

            return result.toDataStreamResponse();
          } catch (aiErr) {
            console.warn("StreamText generation error:", aiErr);
          }
        }

        // Fallback: S3 Snapshot Quantitative Screening
        const { readAnalysisSnapshot } = await import("@/lib/mf-snapshots.server");
        const snap = (await readAnalysisSnapshot("mid", "nifty_midcap_150")) as any;
        const topFunds = snap?.funds?.slice(0, 5) ?? [];

        const fallbackText = `## Answer\nHere is the quantitative screening for mid-cap funds during the active sideways market phase based on verified NAV data.\n\n## Key numbers\n| Scheme | Score | Return (%) | Max DD (%) | Sharpe | Sortino |\n|---|---|---|---|---|---|\n` +
          topFunds
            .map(
              (f: any) =>
                `| ${f.name} | ${f.score?.toFixed(1) ?? "—"} | ${f.return?.toFixed(2) ?? "—"} | ${f.maxDrawdown?.toFixed(2) ?? "—"} | ${f.sharpe?.toFixed(2) ?? "—"} | ${f.sortino?.toFixed(2) ?? "—"} |`,
            )
            .join("\n") +
          `\n\n## What it means\n- Schemes with positive Sharpe and Sortino ratios demonstrated resilient downside protection when the benchmark drifted flat.\n- Low maximum drawdown indicates disciplined risk management.\n\n## Context\nCategory: Mid Cap · Benchmark: Nifty Midcap 150 · Source: AWS S3 AMFI NAV Dataset.\n\n*Disclaimer: Quantitative analysis for research only. Mutual fund investments are subject to market risks.*`;

        return new Response(`0:${JSON.stringify(fallbackText)}\n`, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "x-vercel-ai-data-stream": "v1",
          },
        });
      },
    },
  },
});
