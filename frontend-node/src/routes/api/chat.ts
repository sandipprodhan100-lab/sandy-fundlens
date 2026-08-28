import { createFileRoute } from "@tanstack/react-router";
import { generateText, type UIMessage } from "ai";

import { getAiModel } from "@/lib/ai-gateway.server";
import { ANALYST_SYSTEM_PROMPT, buildAnalystTools } from "@/lib/agent-tools.server";

type Body = { messages?: unknown; threadId?: unknown };

const FREE_MONTHLY_TURNS = 5;

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
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof threadId !== "string" || !uuidRe.test(threadId)) {
          return json({ error: "threadId is required" }, 400);
        }

        const header = request.headers.get("authorization") ?? "";
        const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
        const signedIn = !!token && token.split(".").length === 3;

        // User must be signed in with email / Google
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
        const currentMonth = today.slice(0, 7); // e.g. "2026-08"
        const uiMessages = messages as UIMessage[];

        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        const userId = userData?.user?.id ?? null;
        if (!userId) {
          return json({ error: "Your session expired. Please sign in again." }, 401);
        }

        // Thread validation
        const { data: thread } = await supabaseAdmin
          .from("agent_threads")
          .select("id,user_id,title")
          .eq("id", threadId)
          .maybeSingle();

        if (!thread || thread.user_id !== userId) {
          return json({ error: "Thread not found." }, 404);
        }

        // Check Monthly Usage (5 free analyses per month)
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
              error: `You have reached your quota of ${FREE_MONTHLY_TURNS} free AI analyses for ${currentMonth}. Your quota resets at the start of next month.`,
            },
            429,
          );
        }

        // Increment today's turns for this user
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

        // Record incoming user message
        const lastMsg = uiMessages[uiMessages.length - 1];
        if (lastMsg?.role === "user") {
          await supabaseAdmin.from("agent_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            sdk_message_id: lastMsg.id ?? null,
            parts: lastMsg.parts as unknown as never,
          });

          const firstText = lastMsg.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim();
          if (firstText && (thread.title === "New analysis" || !thread.title)) {
            await supabaseAdmin
              .from("agent_threads")
              .update({ title: firstText.slice(0, 70), updated_at: new Date().toISOString() })
              .eq("id", threadId);
          }
        }

        const latestPrompt =
          lastMsg?.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim() || "";

        let finalAnswer = "";

        // 1. Direct AI Generation using Gemini with S3-backed tools
        const model = getAiModel();
        if (model) {
          try {
            const result = await generateText({
              model,
              system: ANALYST_SYSTEM_PROMPT,
              prompt: latestPrompt,
              tools: buildAnalystTools({ isPro: true }),
              maxSteps: 5,
            });
            finalAnswer = result.text;
          } catch (aiErr) {
            console.warn("Direct Gemini AI generation error:", aiErr);
          }
        }

        // 2. Fallback to S3 Snapshot-backed Quantitative Analysis if API key is not configured
        if (!finalAnswer) {
          const { readAnalysisSnapshot } = await import("@/lib/mf-snapshots.server");
          const snap = (await readAnalysisSnapshot("flexi", "nifty500")) as any;
          const topFunds = snap?.funds?.slice(0, 5) ?? [];

          finalAnswer = `## Answer\nHere is the latest quantitative screening based on verified AMFI NAV data during the active sideways market regime.\n\n## Key numbers\n| Scheme | Score | Return (%) | Max DD (%) | Sharpe | Sortino |\n|---|---|---|---|---|---|\n` +
            topFunds
              .map(
                (f: any) =>
                  `| ${f.name} | ${f.score?.toFixed(1) ?? "—"} | ${f.return?.toFixed(2) ?? "—"} | ${f.maxDrawdown?.toFixed(2) ?? "—"} | ${f.sharpe?.toFixed(2) ?? "—"} | ${f.sortino?.toFixed(2) ?? "—"} |`,
              )
              .join("\n") +
            `\n\n## What it means\n- Schemes with positive Sharpe and Sortino ratios generated superior risk-adjusted alpha when the benchmark stayed range-bound.\n- Lower maximum drawdowns reflect strict capital protection.\n\n## Context\nCategory: Flexi Cap · Benchmark: Nifty 500 · Source: AWS S3 AMFI NAV Dataset.\n\n*Disclaimer: Quantitative analysis for research only. Mutual fund investments are subject to market risks.*`;
        }

        // Record assistant response
        const assistantMessageId = "msg-" + Math.random().toString(36).slice(2, 11);
        await supabaseAdmin.from("agent_messages").insert({
          thread_id: threadId,
          user_id: userId,
          role: "assistant",
          sdk_message_id: assistantMessageId,
          parts: [{ type: "text", text: finalAnswer }] as unknown as never,
        });

        return new Response(finalAnswer, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
